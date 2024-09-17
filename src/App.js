import React, { useState, useEffect, useRef } from 'react';
import ButtonGroup from './ButtonGroup';
import AccountDetails from './AccountDetails';
import './App.css';
import ReactApexChart from 'react-apexcharts';

const App = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [fromDate, setFromDate] = useState('2022-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [organizedData, setOrganizedData] = useState([]);
  const [showData, setShowData] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [portfolio, setPortfolio] = useState([]);
  const [newStock, setNewStock] = useState({
    symbol: '',
    quantity: 0,
    purchasePrice: 0,
    currentPrice: 0,
    growth: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      updateStockPrices();
    }, 10000);  
    return () => clearInterval(interval);
  }, [portfolio]);
  
  const API_KEY = 'f9lTFDQ4KcFs3Pz07Dm7o4DK1ufQLYLd';
  const API_URL = `https://financialmodelingprep.com/api/v3/historical-chart/1day/${symbol}?from=${fromDate}&to=${toDate}&apikey=${API_KEY}`;

  const calculateGrowth = (purchasePrice, currentPrice) => {
    if (purchasePrice !== 0) {
      return currentPrice - purchasePrice;
    }
    return 0;
  };


  const updateStockPrices = async () => {
  try {
    const updatedPortfolio = await Promise.all(portfolio.map(async (stock) => {
      const currentPrice = await fetchStockPrice(stock.symbol);
      const growth = calculateGrowth(stock.purchasePrice, currentPrice);
      console.log(`Updating ${stock.symbol} - Current Price: ${currentPrice}, Growth: ${growth}`);
      
      return {
        ...stock,
        currentPrice,
        growth,
      };
    }));
    setPortfolio(updatedPortfolio);
  } catch (error) {
    console.error('Error updating stock prices:', error);
  }
};

   
  const calculatePerformance = (currentPrice, dividend, purchasePrice, depoCost) => {
    return currentPrice + dividend - purchasePrice - depoCost;
  };

  const handleSearch = async () => {
    await fetchData(API_URL);
    setShowData(true);
  };

  const fetchStockPrice = async (stockSymbol) => {
    try {
      const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${stockSymbol}?apikey=${API_KEY}`);
      const data = await response.json();
      console.log('Fetched stock price:', data);
      return data[0]['price'] || 0;
    } catch (error) {
      console.error('Error fetching stock price:', error);
      return 0;
    }
  };
  
  const fetchStockDividend = async (stockSymbol) => {
    try {
      const response = await fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${stockSymbol}?apikey=${API_KEY}`);
      const data = await response.json();
      if (data && data.historical && data.historical.length > 0) {
        return data.historical[0]['dividend'] || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching stock dividend:', error);
      return 0;   
    }
  };

  const fetchData = async (url) => {
    try {
      const startTime = performance.now();
      const response = await fetch(url);
      const data = await response.json();

      let organizedData = [];

      for (let i = 0; i < data.length; i++) {
        organizedData[i] = {
          x: data[i]['date'],
          y: [data[i]['open'], data[i]['high'], data[i]['low'], data[i]['close']],
          growth: calculateGrowth(data, i),
        };
      }
      setOrganizedData([organizedData]);

      const endTime = performance.now();
      const loadingTime = endTime - startTime;
      setLoadingTime(loadingTime);

      return organizedData;
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const handleShowAdd = async () => {
    if (!showData) {
      await handleSearch();
    }
    setNewStock({
      symbol: '',
      quantity: 0,
      purchasePrice: 0,
      currentPrice: 0,
      growth: 0,
      dividend: 0,
      addedDateTime: new Date().toLocaleString()
    });
    setShowData(!showData);
  };

  const handleRegistration = () => {
    if (username !== '' && password !== '') {
      const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
      const userExists = existingUsers.some(user => user.username === username);

      if (userExists) {
        alert('Username already exists. Please choose a different one.');
      } else {
        const newUser = { username, password };
        localStorage.setItem('users', JSON.stringify([...existingUsers, newUser]));
        setLoggedInUser(username);
        setRegistrationMode(false);
      }
    }
  };

  const handleLogin = () => {
    if (username !== '' && password !== '') {
      const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
      const user = existingUsers.find(user => user.username === username);
  
      if (user && user.password === password) {
        setLoggedInUser(username);
        const userPortfolioData = JSON.parse(localStorage.getItem(username)) || [];
        setPortfolio(userPortfolioData);
         
        setShowData(true);
      } else {
        alert('Invalid username or password.');
      }
    }
  };
   
  const handleLogout = () => {
    localStorage.setItem(loggedInUser, JSON.stringify(portfolio));
    setLoggedInUser(null);
    setPortfolio([]);
  };

  const handleAddStock = async () => {
    try {
      if (newStock.quantity <= 0 || isNaN(newStock.quantity)) {
        alert('Please enter a valid quantity.');
        return;
      }

      const currentPrice = await fetchStockPrice(symbol);
      const growth = calculateGrowth([{ close: currentPrice }], 0);
      const depoCost = currentPrice * newStock.quantity * 0.01; 
      const dividend = await fetchStockDividend(symbol);
      const performance = calculatePerformance(currentPrice, dividend, currentPrice * newStock.quantity, depoCost); // Kaufpreis mal Quantität für den PurchasePrice
      const historicalData = await fetchData(API_URL);
      const newStockWithPrice = {
        ...newStock,
        symbol,
        purchasePrice: currentPrice * newStock.quantity, // Kaufpreis mal Quantität für den PurchasePrice
        currentPrice,
        growth,
        depoCost,
        dividend,
        performance,
        data: historicalData || [],
      };

      const existingStockIndex = portfolio.findIndex(stock => stock.symbol === symbol);

      if (existingStockIndex !== -1) {
        const updatedPortfolio = [...portfolio];
        updatedPortfolio[existingStockIndex].quantity += newStock.quantity;
        updatedPortfolio[existingStockIndex].depoCost += depoCost;
        updatedPortfolio[existingStockIndex].performance += performance;
        updatedPortfolio[existingStockIndex].addedDateTime = new Date().toLocaleString();
        localStorage.setItem(loggedInUser, JSON.stringify(updatedPortfolio));
        setPortfolio(updatedPortfolio);
      } else {
        const storedPortfolio = JSON.parse(localStorage.getItem(loggedInUser)) || [];
        const existingStock = storedPortfolio.find(stock => stock.symbol === symbol);
        if (existingStock) {
          existingStock.quantity += newStock.quantity;
          existingStock.depoCost += depoCost;
          existingStock.performance += performance;
          existingStock.addedDateTime = new Date().toLocaleString();
        } else {
          storedPortfolio.push(newStockWithPrice);
        }
        localStorage.setItem(loggedInUser, JSON.stringify(storedPortfolio));
        setPortfolio(storedPortfolio);
      }

      handleShowCurrentStock();

      setShowData(true);
      handleShowAdd();
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleRemoveStock = (index) => {
    const updatedPortfolio = [...portfolio];
    updatedPortfolio.splice(index, 1);
    localStorage.setItem(loggedInUser, JSON.stringify(updatedPortfolio));
    setPortfolio(updatedPortfolio);
  };

  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
  };

  const handleQuantityChange = (e) => {
    setNewStock({ ...newStock, quantity: parseInt(e.target.value) });
  };

  const handleShowSingleStock = async (symbol) => {
    const url = `https://financialmodelingprep.com/api/v3/historical-chart/1day/${symbol}?from=${fromDate}&to=${toDate}&apikey=${API_KEY}`;
    const data = await fetchData(url);
    const color = '#008FFB';
    const seriesData = [{
      name: symbol,
      data: data.map(entry => [new Date(entry.x).getTime(), entry.y[3]]),
      color: color
    }];
    setOrganizedData(seriesData);
    setShowData(true);
  };

  const handleShowGroup = async () => {
    const symbols = portfolio.map(stock => stock.symbol);
    const colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'];
    let combinedData = [];

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const color = colors[i % colors.length];

      const url = `https://financialmodelingprep.com/api/v3/historical-chart/1day/${symbol}?from=${fromDate}&to=${toDate}&apikey=${API_KEY}`;
      const data = await fetchData(url);
      combinedData.push({ name: symbol, data, color });
    }

    const seriesData = combinedData.map(stock => ({
      name: stock.name,
      data: stock.data.map(entry => [new Date(entry.x).getTime(), entry.y[3]]),
      color: stock.color
    }));

    setOrganizedData(seriesData);
    setShowData(true);
  };

  const handleShowCurrentStock = async () => {
    try {
      const API_URL = `https://financialmodelingprep.com/api/v3/historical-chart/1day/${symbol}?apikey=${API_KEY}`;
      const response = await fetch(API_URL);
      const data = await response.json();
  
      setOrganizedData([{
        name: symbol,
        data: data.map(item => ({
          x: new Date(item.date),
          y: item.close,
        })),
      }]);
  
      setShowData(true);
    } catch (error) {
      console.error('Error fetching current stock data:', error);
    }
  };

  useEffect(() => {
    console.log('Loading time:', loadingTime.toFixed(2), 'milliseconds');
  }, [loadingTime]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Portfolio Manager</h1>
        {loggedInUser ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {registrationMode ? (
              <button onClick={handleRegistration}>Register</button>
            ) : (
              <button onClick={handleLogin}>Login</button>
            )}
            <button onClick={() => setRegistrationMode(!registrationMode)}>
              {registrationMode ? 'Back to Login' : 'Register'}
            </button>
          </>
        )}
      </header>
      {loggedInUser && (
        <>
          <div className="search-container">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter Stock Symbol"
            />
            <input
              type="number"
              value={newStock.quantity}
              onChange={handleQuantityChange}
              placeholder="Enter Quantity"
            />
            <ButtonGroup 
              handleAddStock={handleAddStock} 
              handleShowCurrentStock={handleShowCurrentStock} 
              handleShowGroup={handleShowGroup} 
            />
            {showData && (
              <>
                <label>From:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={handleFromDateChange}
                />
                <label>To:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={handleToDateChange}
                />
              </>
            )}
          </div>
          {showData && (
            <div className="stock-chart">
              <ReactApexChart
                options={{
                  xaxis: {
                    type: 'datetime',
                    labels: {
                      style: {
                        colors: 'white'
                      }
                    }
                  },
                  yaxis: {
                    labels: {
                      style: {
                        colors: 'white'
                      }
                    },
                    colors: organizedData.map(stock => stock.color),
                    tooltip: {
                      style: {
                        color: 'black' // Schriftfarbe der Tooltipps
                      }
                    }
                  },
                  colors: organizedData.map(stock => stock.color),
                }}
                series={organizedData}
                type="line"
                width={800}
                height={400}
                apiKey={API_KEY}
              />
              <p>Loading Time: {loadingTime.toFixed(2)} milliseconds</p>
            </div>
          )} 
          <AccountDetails
            username={loggedInUser}
            portfolio={portfolio}
            totalPortfolioValue={portfolio.reduce(
              (total, stock) => total + ((stock.currentPrice || 0) * stock.quantity),
              0
            )}
            handleRemoveStock={handleRemoveStock}
            handleShowSingleStock={handleShowSingleStock}
            handleShowGroup={handleShowGroup}
          />
        </>
      )}
    </div>
  );
};

export default App;
















