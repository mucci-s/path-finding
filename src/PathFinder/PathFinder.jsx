import React, { Component } from "react";
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Queue from "../utils/Queue.js";
import Node from "./Node/Node";
import "./PathFinder.css";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';

const START_NODE_ROW = 8;
const START_NODE_COL = 8;
const FINISH_NODE_ROW = 8;
const FINISH_NODE_COL = 14;


const wWindow = window.innerWidth;
const hWindow = window.innerHeight;

var MAZE_HEIGHT = 15;
var MAZE_WIDTH = 50;


export default class PathFinder extends Component {
  constructor() {
    super();
    this.state = {
      foundTarget: false,
      grid: [],
      mouseIsPressed: false,
      lastNodeDrag: {},
      lastStart: {},
      startNode: { row: START_NODE_ROW, col: START_NODE_COL },
      targetNode: { row: FINISH_NODE_ROW, col: FINISH_NODE_COL },
      nodeMouseOver: {},
      dialogState: false,
    };
    this.dialogClose = this.dialogClose.bind(this);
    this.dialogOpen = this.dialogOpen.bind(this);

  }

  handleMouseDown(row, col) {
    const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
    this.setState({ grid: newGrid, mouseIsPressed: true });
  }

  DragEnd(row, col) {
    this.handleMouseUp();
    let node = this.state.lastNodeDrag;

    if (
      document.getElementById("node-" + node.row + "-" + node.col).className ===
      "node "
    ) {
      if (this.state.grid[row][col].isStart) {
        this.setState({ startNode: { row: node.row, col: node.col } });
        getNewGridWithStart(this.state.grid, node.row, node.col, row, col);
      }
      if (this.state.grid[row][col].isFinish) {
        this.setState({ targetNode: { row: node.row, col: node.col } });
        getNewGridWithTarget(this.state.grid, node.row, node.col, row, col);
      }
    }
  }

  onDragOverHandler(row, col) {
    this.setState({ mouseIsPressed: true });
    this.setState({ lastNodeDrag: { row, col } });
  }

  handleMouseEnter(row, col) {
    if (!this.state.mouseIsPressed) {
      return;
    }
    const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
    this.setState({ grid: newGrid });
  }

  handleMouseUp() {
    this.setState({ mouseIsPressed: false });
  }

  componentDidMount() {
    const grid = getInitialGrid();
    this.setState({ grid });
    this.setState({ startNode: { row: START_NODE_ROW, col: START_NODE_COL } });
    this.setState({ targetNode: { row: FINISH_NODE_ROW, col: FINISH_NODE_COL } });
    
  }
  

  BFS() {
    let found = false; 
    this.cleanPath()
    let queue = new Queue();
    let visited = new Map();
    visited.set(JSON.stringify(this.state.startNode), null);
    queue.enqueue(this.state.startNode);

    const grid = this.state.grid;
    while (!queue.isEmpty) {
      let curNode = queue.dequeue();

      if (JSON.stringify(curNode) === JSON.stringify(this.state.targetNode)) {
        this.animate(visited);
        found = true;
        break;
      }
      let nextNodes = [];
      const gridLength = Object.keys(this.state.grid[0]).length;
      const gridWidth = this.state.grid.length;

      nextNodes = [
        { row: curNode.row - 1, col: curNode.col },
        { row: curNode.row + 1, col: curNode.col },
        { row: curNode.row, col: curNode.col - 1 },
        { row: curNode.row, col: curNode.col + 1 },
      ];

      nextNodes.forEach((node) => {
        if (
          node.row < gridWidth &&
          node.row >= 0 &&
          node.col < gridLength &&
          node.col >= 0
        ) {
          if (!grid[node.row][node.col].isWall) {
            if (!visited.has(JSON.stringify(node))) {
              queue.enqueue(node);
              visited.set(JSON.stringify(node), curNode);
            }
          }
        }
      });
    }
    if(!found){this.dialogOpen()}
    return visited;
  }


 
  DFS = async (node, visited, callback) => {
    const grid = this.state.grid;
    if(JSON.stringify(node) === JSON.stringify(this.state.startNode))
      visited.set(JSON.stringify(node), null);
   
    let curNode = node;
    let nextNodes = [];

    const gridLength = Object.keys(this.state.grid[0]).length;
    const gridWidth = this.state.grid.length;

    nextNodes = [
      { row: curNode.row - 1, col: curNode.col },
      { row: curNode.row, col: curNode.col + 1 },
      { row: curNode.row + 1, col: curNode.col },
      { row: curNode.row, col: curNode.col - 1 },
    ];

    nextNodes.forEach((node) => {
      if (node.row < gridWidth && node.row >= 0 
        && node.col < gridLength && node.col >= 0) {
        if (!grid[node.row][node.col].isWall) {
          if (!visited.has(JSON.stringify(node))) {
            visited.set(JSON.stringify(node), curNode);
            if (JSON.stringify(node).localeCompare(JSON.stringify(this.state.targetNode)) === 0) {
              this.animate(visited);   
              this.setState({foundTarget: true})
              return;
            }else{
              this.DFS(node, visited);
            } 
          }
        }
      }
    });
  }

  checkDFS = async () =>{
    await this.wait(this.DFS(this.state.startNode, new Map()))
    if(!this.state.foundTarget)
      this.dialogOpen()
  }
  wait = (microsecs) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(), microsecs);
    });
  };



  Astar(start, target){
    this.cleanPath()
    let found;
    let grid = this.state.grid;
    let openSet = new Set();
    openSet.add(JSON.stringify(start));
    
    let cameFrom = new Map();
    grid[start.row][start.col].distance = 0;
   
    let fScore = new Map();
    fScore.set(JSON.stringify(start), this.manhattanDistance(start));
    
    while(openSet.size){
      let currentNode;
        currentNode = this.getMinNodeValue(openSet,fScore);
      if(currentNode === JSON.stringify(this.state.targetNode)){
        this.animate(cameFrom)
        this.setState({foundTarget: true})
        found = true;
        break;
      }
      
      openSet.delete(currentNode);
      let nextNodes = [];

      const gridLength = Object.keys(this.state.grid[0]).length;
      const gridWidth = this.state.grid.length;
    
      currentNode = JSON.parse(currentNode);
      nextNodes = [
        { row: currentNode.row - 1, col: currentNode.col },
        { row: currentNode.row, col: currentNode.col + 1 },
        { row: currentNode.row + 1, col: currentNode.col },
        { row: currentNode.row, col: currentNode.col - 1 },
      ]; 
      
      nextNodes.forEach((node) => {
        if (node.row < gridWidth && node.row >= 0 
          && node.col < gridLength && node.col >= 0) {
          if (!grid[node.row][node.col].isWall) {
            let tentative_gScore = grid[currentNode.row][currentNode.col].distance + 1;
            if(tentative_gScore < grid[node.row][node.col].distance){
              cameFrom.set(JSON.stringify(node), currentNode);
              grid[node.row][node.col].distance = tentative_gScore;
              fScore.set(JSON.stringify(node), tentative_gScore + this.manhattanDistance(node));
              if(!openSet.has(JSON.stringify(node))){
                openSet.add(JSON.stringify(node));
              }
            }
          }
        }
      });
    }
    if(!found){this.dialogOpen()}
    // this.checkFound()
  }

  getMinNodeValue(set,scores){
    const _intersection = new Map();
    for (const elem of scores.keys()) {
      if (set.has(elem)) {
         _intersection.set(elem, scores.get(elem));
      }
    }
    let min = [..._intersection.entries()]
        .filter(({ 1: v }) => v === Math.min(..._intersection.values()))
        .map(([k]) => k);
    return min[0];   
  }


  manhattanDistance(node){
      let node2 = this.state.targetNode;
      return (Math.abs(node.col - node2.col) + Math.abs(node.row - node2.row))
  }

  
 
 
  animate(nodesVisited) {

    nodesVisited = new Map(nodesVisited);
    let nodes = Array.from(nodesVisited.keys());
    for (let i = 1; i < nodesVisited.size; i++) {
      setTimeout(() => {
        const node = JSON.parse(nodes[i]);

        if (nodes[i] !== JSON.stringify(this.state.targetNode)) {
          document.getElementById(`node-${node.row}-${node.col}`).className =
            "node node-visited";
        } else this.animatePath(nodesVisited);
      }, 10 * i);
    }
    let buttons = [...document.getElementsByClassName('btn')];
    buttons.forEach(element => {
      element.disabled = true;
    });

    document.getElementById('grid').className = "grid disabledDiv"
    
  }

  animatePath(nodesVisited) {
    nodesVisited = new Map(nodesVisited);
    let curNode = this.state.targetNode;
    let path = [];
        
    while (JSON.stringify(curNode) !== JSON.stringify(this.state.startNode)) {
      path.push(curNode);
      curNode = nodesVisited.get(JSON.stringify(curNode));
    }
    path.push(curNode);

    for (let i = path.length-1; i >= 0; i--){
      setTimeout(() => {
          document.getElementById(`node-${path[i].row}-${path[i].col}`).className =
            "node node-shortest-path";

            if(i === 0){
              let buttons = [...document.getElementsByClassName('btn')];
              buttons.forEach(element => {
                    element.disabled = false;
              });
                            
            }     
      }, 50 * (path.length-i));
    }
    

   
  }

  clean(){
    // let grid = getInitialGrid();
    // this.setState({grid})
    
    this.componentDidMount();
    let grid = this.state.grid
    grid.forEach(row => {
    row.forEach(node => {
      // console.log(document.getElementById('node-'+node.row+'-'+node.col))
      document.getElementById('node-'+node.row+'-'+node.col).className = 'node '
      if(node.row === 16 && node.col === 49){
        document.getElementById('btn-maze').disabled = false;
        document.getElementById('grid').className = "grid"
       
      }

    });
   });
  


  }

  cleanPath(){
    let grid = this.state.grid   
    grid.forEach(row => {
      row.forEach(node => {
      // console.log(document.getElementById('node-'+node.row+'-'+node.col))
      getNewGridUpdateDistance(grid,node.row, node.col);
      if(document.getElementById('node-'+node.row+'-'+node.col).className === 'node node-visited' 
        ||document.getElementById('node-'+node.row+'-'+node.col).className === 'node node-shortest-path'){
          document.getElementById('node-'+node.row+'-'+node.col).className = 'node '
        }
    });
   });
   document.getElementById('grid').className = "grid"

  }

  setFullWallGrid(){
    let grid = this.state.grid 
    let newGrid;
    let node = {row:1,col:1}

    newGrid = getNewGridWithStart(this.state.grid, 1,  1, this.state.startNode.row,this.state.startNode.col);
    this.setState({startNode:node, grid:newGrid})

    let node2 = {row:MAZE_HEIGHT-2,col:MAZE_WIDTH-2}
    newGrid = getNewGridWithTarget(this.state.grid, MAZE_HEIGHT-2, MAZE_WIDTH-2, this.state.targetNode.row,this.state.targetNode.col);
    this.setState({targetNode:node2, grid:newGrid})

    grid.forEach(row => {
      row.forEach(node => {
        newGrid = getNewGridWithWallToggled(grid,node.row,node.col);
        // document.getElementById('node-'+node.row+'-'+node.col).className = 'node node-wall'  
    });
   });
   this.setState({grid:newGrid})
  }

  mazeGenerator(node, visited){
    const grid = this.state.grid;
    visited.add(JSON.stringify(node))
    let curNode = node;
    let nextNodes = [];
    const gridLength = Object.keys(this.state.grid[0]).length;
    const gridWidth = this.state.grid.length;

    

    nextNodes = [
      { row: curNode.row - 2, col: curNode.col },
      { row: curNode.row, col: curNode.col + 2 },
      { row: curNode.row + 2, col: curNode.col },
      { row: curNode.row, col: curNode.col - 2 },
    ];
 
    nextNodes = [...nextNodes].filter((v) => {
      if (v.row < gridWidth && v.row >= 0 && v.col < gridLength && v.col >= 0
        && !visited.has(JSON.stringify(v)))
        return true;
      else return false;
    })

    const random = Math.floor(Math.random() * nextNodes.length);
    if(nextNodes.length){
      let tempNode={};
    if(nextNodes[random].row > curNode.row)
      tempNode = {row:node.row+1,col:node.col}
    if(nextNodes[random].row < curNode.row)
      tempNode = {row:node.row-1,col:node.col}
    if(nextNodes[random].col > curNode.col)
      tempNode = {row:node.row,col:node.col+1}
    if(nextNodes[random].col < curNode.col)
      tempNode = {row:node.row,col:node.col-1}
    visited.add(JSON.stringify(tempNode)) 
    this.mazeGenerator(nextNodes[random], visited);
  }

    nextNodes.forEach((node) => {
          if (!visited.has(JSON.stringify(node))) {
             this.mazeGenerator(nextNodes[random], visited);
        }     
    });
      return visited;
  }

  createMaze(){
    this.clean();
    setTimeout(() => {

    this.setFullWallGrid();
    let nodes = this.mazeGenerator({row:1, col:1}, new Set());
    let grid = this.state.grid;

    nodes = [...nodes];
    for (let i = 0; i < nodes.length; i++) {
      setTimeout(() => {
        // document.getElementById('btn-maze').disabled = true;
        nodes[i] = JSON.parse(nodes[i]);
        let newGrid = getNewGridWithWallToggled(grid,nodes[i].row,nodes[i].col);
        this.setState({grid:newGrid})
        
        if(i===nodes.length-1)
          document.getElementById('root').className = ""

          
      }, 10*i);  
    }
    }, 100);   
   document.getElementById('root').className = "disabledDiv"
  }

  dialogClose(){
    this.setState({dialogState:false})
  }
  dialogOpen(){
    this.setState({dialogState:true})
  }
  


  render() {
    const { grid, mouseIsPressed} = this.state;
    return (
      <div style={{width: "100%"}}>
        <header> PATH FINDER </header>
        <div className="panel">       
      <Dialog
        open={this.state.dialogState}
        onClose={this.dialogClose}
        aria-labelledby="alert-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          {"There is NO PATH for the Target"}
        </DialogTitle>
      </Dialog>

      <Button  
          style={{ fontFamily: "sans-serif" , marginRight: "25px" }} 
          id="btn-maze" className="btn" variant="outlined" 
          size="large" 
          onClick={() =>this.createMaze()}> Create Maze </Button>

      <Button  
          style={{ fontFamily: "sans-serif" , marginRight: "25px" }} 
          id="btn-maze" className="btn" variant="outlined" 
          size="large" 
          onClick={() => {this.cleanPath(); this.checkDFS() }}>Visualize DFS </Button> 

      <Button  
          style={{ fontFamily: "sans-serif" , marginRight: "25px" }} 
          id="btn-maze" className="btn" variant="outlined" 
          size="large" 
          onClick={() => this.BFS()}> Visualize BFS </Button> 

      <Button  
          style={{ fontFamily: "sans-serif"  }} 
          id="btn-maze" className="btn" variant="outlined" 
          size="large" 
          onClick={() => this.Astar(this.state.startNode, this.state.targetNode)}> Visualize A* </Button> 

      {/* <button e id="btn-maze" className="btn" onClick={() => this.createMaze()}>Create Maze </button>
      <button id="btn-dfs" className="btn"onClick={() => {this.cleanPath(); this.DFS(this.state.startNode, new Map());}}>Visualize DFS </button>
      <button id="btn-bfs" className="btn"onClick={() => this.BFS()}>Visualize BFS </button>
      <button id="btn-A-star" className="btn"onClick={() => this.Astar(this.state.startNode, this.state.targetNode)}> Visualize A* </button>
      <button id="btn-cln-path" className="btn"onClick={() => this.cleanPath()}> Clean Path</button>
      <button id="btn-cln-board" className="btn"onClick={() => this.clean()}> Clean Board</button> */}
        </div>
      <div id="grid" draggable="false" className="grid">
      
        <div draggable="false" id="board" className="prov">
          {grid.map((row, rowIdx) => {
            return (
              <div draggable="false" id="row" key={rowIdx}>
                {row.map((node, nodeIdx) => {
                  const { row, col, isFinish, isStart, isWall } = node;
                  return (
                    <Node
                      key={nodeIdx}
                      col={col}
                      isFinish={isFinish}
                      isStart={isStart}
                      isWall={isWall}
                      mouseIsPressed={mouseIsPressed}
                      onMouseDown={(row, col) => this.handleMouseDown(row, col)}
                      onMouseEnter={(row, col) =>
                        this.handleMouseEnter(row, col)
                      }
                      onMouseUp={() => this.handleMouseUp()}
                      onDragOver={() => this.onDragOverHandler(row, col)}
                      onDragEnd={(row, col) => this.DragEnd(row, col)}
                      row={row}
                    ></Node>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <footer> 
        <Button  
        style={{ fontFamily: "sans-serif" , margin:"20px 20px 0 0" }} 
        id="btn-maze" className="btn" variant="contained" 
        size="large" 
        onClick={() => this.cleanPath()}> Clean Path </Button>  
              
        <Button  
        style={{ fontFamily: "sans-serif" , margin:"20px 0 0 20px" }} 
        id="btn-maze" className="btn" variant="contained" 
        size="large"
        onClick={() => this.clean()}> Clean Board </Button>
      </footer>        
      </div>
    );
  }
}
// const ColorButton = styled(Button)(({ theme }) => ({
//   color: theme.palette.getContrastText(colors.green["A700"]),
//   backgroundColor: colors.green["A700"],
//   '&:hover': {
//     backgroundColor: colors.green[500],
//   },
// }));


const getInitialGrid = () => {
 
  const grid = [];

  if(hWindow > 700){ MAZE_HEIGHT = 17 }
  if(wWindow > 1700){ MAZE_WIDTH = 60 }
  for (let row = 0; row < MAZE_HEIGHT; row++) {
    const currentRow = [];
    for (let col = 0;col < MAZE_WIDTH; col++) {
      currentRow.push(createNode(col, row));
    }
    grid.push(currentRow);
  }
  return grid;
};

const createNode = (col, row) => {
  return {
    col,
    row,
    isStart: row === START_NODE_ROW && col === START_NODE_COL,
    isFinish: row === FINISH_NODE_ROW && col === FINISH_NODE_COL,
    distance: Infinity,
    isVisited: false,
    isWall: false,
    previousNode: null,
  };
};

const getNewGridWithWallToggled = (grid, row, col) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  const newNode = {
    ...node,
    isWall: !node.isWall,
  };
  newGrid[row][col] = newNode;
  return newGrid;
};


const getNewGridUpdateDistance = (grid, row, col) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  const newNode = {
    ...node,
    distance: Infinity,
  };
  newGrid[row][col] = newNode;
  return newGrid;
};

const getNewGridWithStart = (grid, row, col, rowLastStart, colLastStart) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];

  const lastStartNode = newGrid[rowLastStart][colLastStart];

  const newStart = {
    ...node,
    isStart: !node.isStart,
  };
  const newNode = {
    ...lastStartNode,
    isStart: false,
    isWall: false,
  };
  newGrid[rowLastStart][colLastStart] = newNode;
  newGrid[row][col] = newStart;
  return newGrid;
};

const getNewGridWithTarget = (grid, row, col, rowLastTarget, colLastTarget) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];

  const lastTargetNode = newGrid[rowLastTarget][colLastTarget];

  const newFinish = {
    ...node,
    isFinish: !node.isFinish,
  };
  const newNode = {
    ...lastTargetNode,
    isFinish: false,
    isWall: false,
  };
  newGrid[rowLastTarget][colLastTarget] = newNode;
  newGrid[row][col] = newFinish;
  return newGrid;
};
