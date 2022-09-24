import React, {Component} from 'react';

import './Node.css';

export default class Node extends Component {
  render() {
    const {
      col,
      isFinish,
      isStart,
      isWall,
      onMouseDown,
      onMouseEnter,
      onMouseUp,
      onDragOver,
      onDragEnd,
      row,
    } = this.props;
    const extraClassName = isFinish
      ? 'node-finish'
      : isStart
      ? 'node-start'
      : isWall
      ? 'node-wall'
      : '';
  if(isStart || isFinish){
    return (
      <div
        draggable="true"
        id={`node-${row}-${col}`}
        className={`node ${extraClassName}`}
        // className={`node `}
        onMouseDown={() => onMouseDown(row, col)}
        onMouseEnter={() => onMouseEnter(row, col)}
        onMouseUp={() => onMouseUp()}
        onDragEnd = {() => onDragEnd(row, col)}
       
        >
          <div 
        className={`node ${extraClassName}`}
            
            draggable = 'true'
            >  
          </div>
           
        </div>
    );
  }else
  return (
    <div
      draggable="false"
      id={`node-${row}-${col}`}
      className={`node ${extraClassName}`}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={() => onMouseUp()}
      onDragEnd = {() => onDragEnd(row, col)}
      onDragOver = {() => onDragOver(row,col)}
      >
         
      </div>
  );
    
  }
}