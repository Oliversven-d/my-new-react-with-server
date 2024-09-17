import React from 'react';

const AccountDetails = ({ username, portfolio, totalPortfolioValue, handleRemoveStock, handleShowSingleStock, handleShowGroup }) => {
  const totalDepoCost = portfolio.reduce((total, stock) => total + stock.depoCost, 0);
  
  return (
    <div className="account-details" style={{ textAlign: 'center', color: 'white' }}>
      <h2>Stock Analysis</h2>
      <p>Username: {username}</p>
      {portfolio.length > 0 ? (
        <>
          <h3>Portfolio</h3>
          <table>
            <thead>
              <tr>
                <th>Stock Symbol</th>
                <th>Quantity</th>
                <th>Purchase Price</th>
                <th>Current Price per Stock</th>
                <th>Total Stock Value</th>
                <th>Performance</th>
                <th>Growth</th>
                <th>Depot Cost</th>
                <th>Dividend</th>
                <th>Added Date & Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((stock, index) => (
                <tr key={index}>
                  <td>{stock.symbol ? stock.symbol : 'N/A'}</td>
                  <td>{stock.quantity}</td>
                  <td>${stock.purchasePrice !== null && stock.purchasePrice !== undefined ? stock.purchasePrice.toFixed(2) : 'N/A' * stock.quantity}</td>
                  <td>${stock.currentPrice !== null && stock.currentPrice !== undefined ? stock.currentPrice.toFixed(2) : 'N/A'}</td>
                  <td>${(stock.currentPrice * stock.quantity).toFixed(2)}</td>
                  <td style={{ color: (stock.performance * stock.quantity) >= 0 ? 'green' : 'red' }}>
                  ${((stock.performance * stock.quantity).toFixed(2))}</td>
                  <td style={{ color: ((stock.currentPrice - stock.purchasePrice) * stock.quantity) >= 0 ? 'green' : 'red' }}>
                  ${((stock.currentPrice - stock.purchasePrice) * stock.quantity).toFixed(2)}</td>
                  <td>${stock.depoCost.toFixed(2) * stock.quantity}</td>
                  <td>${stock.dividend !== null && stock.dividend !== undefined ? stock.dividend.toFixed(2) : '0.00' * stock.quantity}</td>
                  <td>{stock.addedDateTime || 'N/A'}</td>
                  <td>
                    <button onClick={() => handleRemoveStock(index)}>Delete</button>
                     
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>No stocks in portfolio.</p>
      )}
      <p>Total Portfolio Value: ${!isNaN(totalPortfolioValue) ? totalPortfolioValue.toFixed(2) : '0.00'}</p>
      <p>Total Depot Cost: ${!isNaN(totalDepoCost) ? totalDepoCost.toFixed(2) : '0.00'}</p>
    </div>
  );
};

export default AccountDetails;


