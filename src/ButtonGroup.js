import React from 'react';

const ButtonGroup = ({ handleAddStock, handleShowCurrentStock, handleShowGroup }) => {
  return (
    <div>
      <button onClick={handleAddStock}>Add Stock</button>
      <button onClick={handleShowCurrentStock}>Show Current Stock</button>
      <button onClick={handleShowGroup}>Compare Stocks</button>
    </div>
  );
};

export default ButtonGroup;








