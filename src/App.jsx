import {useLayoutEffect, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'

const generator = rough.generator();

function createNewElement(id, x1, y1, x2, y2, elementType){
  const roughElement = elementType === "rectangle"? generator.rectangle(x1, y1, x2-x1, y2-y1): generator.line(x1, y1, x2, y2);
  return {id, x1, y1, x2, y2, elementType, roughElement}
}

const distance = (a,b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const isWithinElements = (x, y, element)=>{
  const {elementType, x1, x2, y1, y2} = element;
  if(elementType == "rectangle"){
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return x >= minX && x <= maxX && y >=minY && y <= maxY
  }else{
    const a = {x: x1, y: y1};
    const b = {x: x2, y: y2};
    const c = {x, y};
    const offset = distance(a,b) - (distance(a,c) + distance(b,c));
    return Math.abs(offset) < 1;
  }
};


function getElementAtPosition (x, y,elements){
  return elements.find(element => isWithinElements(x, y, element))
}


function App() {
  const [elements, setElements] = useState([]);
    const [action, setAction] = useState('none');
    const [tool, setTool] = useState("line");
    const [selectedElement, setSelectedElement] = useState(null);
  useLayoutEffect(() => {

    const canvas = document.getElementById("canvas");
    const conext = canvas.getContext("2d");
    //clear the screen
    conext.clearRect(0, 0, canvas.width, canvas.height);
    
    const roughCanvas = rough.canvas(canvas);
    const rect = generator.rectangle(10,10,100,100);
    const line = generator.line(10,10,110,110);

    // const circle = generator.circle(50,100);
    // roughCanvas.draw(rect);
    // roughCanvas.draw(line); 
    // roughCanvas.draw(circle);

    elements.forEach(({roughElement}) => roughCanvas.draw(roughElement));

  }, [elements, action]);

  const updateElement = (id, x1, y1, x2, y2, elementType) =>{
    const updateElement = createNewElement(id, x1, y1, x2, y2, elementType);
      
      const elementCopy = [...elements];
      elementCopy[id] = updateElement;
      setElements(elementCopy);
  }

  const handeMouseDown = (event) => {
    const {clientX, clientY} = event;
    if(tool === "selection"){
      //todo if we are selecting an element
      //setAction(moving)
      console.log(elements)
      const element = getElementAtPosition(clientX, clientY, elements);
      if(element){
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({...element, offsetX, offsetY});
        setAction("moving");
      }
    }else{
      // console.log(clientX, clientY)
      const id = elements.length;
      const newElement = createNewElement(id, clientX, clientY, clientX, clientY, tool);
      //useState
      setElements(prevState => [...prevState, newElement]);
      console.log(elements);
      setAction('drawing');
    }
  };

  const handeMouseMove = (event) => {
    const {clientX, clientY} = event;


    if(tool === "selection"){
      event.target.style.cursor = getElementAtPosition(clientX, clientY, elements) ? "move" : "default";
    }
    if(action === 'drawing') {
      const index = elements.length - 1;
      const {x1, y1} = elements[index];
      
      updateElement(index, x1, y1, clientX, clientY, tool);
      
    }else if (action === "moving"){
      const {id, x1, x2, y1, y2,  offsetX, offsetY, elementType} = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - offsetX;
      const newY1 = clientY - offsetY;
      updateElement(id, newX1,newY1, newX1 + width, newY1 + height, elementType);
    }
  };

  const handeMouseUp = (event) => {
    setAction('none');
    setSelectedElement(null);
  };

  

  return (
    <>
    <div>
      <div style={{position:"fixed"}}>
        <input 
        type="radio"
        id = "selection"
        checked = {tool === "selection"}
        onChange = {()=> setTool("selection")}        
        />
        <label htmlFor='selection'>Selection</label>

        <input 
        type="radio"
        id = "line"
        checked = {tool === "line"}
        onChange = {()=> setTool("line")}        
        />
        <label htmlFor='line'>Line</label>
        
        <input 
        type="radio"
        id = "rectangle"
        checked = {tool === "rectangle"}
        onChange = {()=> setTool("rectangle")}        
        />
        <label htmlFor='rectangle'>Rectangle</label>
        
      </div>
    <canvas 
      id = "canvas" 
      style={{backgroundColor: 'cyan'}} 
      width={window.innerWidth} 
      height = {window.innerHeight}
      onMouseDown = {handeMouseDown}
      onMouseUp = {handeMouseUp}
      onMouseMove = {handeMouseMove}
      >
        Canvas
      </canvas>
    </div>
      
    </>
  )
}

export default App
