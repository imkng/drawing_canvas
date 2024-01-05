import {useLayoutEffect, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'

const generator = rough.generator();

function createNewElement(id, x1, y1, x2, y2, elementType){
  const roughElement = elementType === "rectangle"? generator.rectangle(x1, y1, x2-x1, y2-y1): generator.line(x1, y1, x2, y2);
  return {id, x1, y1, x2, y2, elementType, roughElement}
}

const distance = (a,b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const nearPoint = (x,y, x1, y1, name) =>{
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name: null;
};


const positionWithinElements = (x, y, element)=>{
  const {elementType, x1, x2, y1, y2} = element;
  if(elementType == "rectangle"){
    const topLeft = nearPoint(x,y, x1, y1, "tl");
    const topRight = nearPoint(x,y, x2, y1, "tr");
    const bottomLeft = nearPoint(x,y, x1, y2, "bl");
    const bottomRight = nearPoint(x,y, x2, y2, "br");
    const inside =  x >= x1 && x <= x2 && y >=y1 && y <= y2 ? "inside": null;
    return topLeft || topRight|| bottomLeft|| bottomRight || inside;
  }else{
    const a = {x: x1, y: y1};
    const b = {x: x2, y: y2};
    const c = {x, y};
    const offset = distance(a,b) - (distance(a,c) + distance(b,c));
    const start = nearPoint(x, y, x1, y1,"start");
    const end = nearPoint(x, y, x2, y2,"end");
    const inside =  Math.abs(offset) < 1 ? "inside": null;
    return start || end || inside;
  }
};


const cursorForPosition = position => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};

function getElementAtPosition (x, y,elements){
return elements
              .map(element => ({...element, position: positionWithinElements(x, y, element)}))
              .find(element => element.position != null);
}


const adjustElementCoordinates = (element)=>{
  const {elementType, x1, y1, x2, y2} = element;
  if(elementType === "rectangle"){
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return {x1: minX, y1: minY, x2: maxX, y2: maxY};
  }else{
    if(x1 < x2 || (x1 === x2 && y1 < y1)){
      return {x1, y1, x2, y2};
    }else{
      return {x1: x2, y1: y2, x2: x1, y2: y1};
    }
  }
};



const resizeCoordinates = (clientX, clientY, position, coordinates) => {
  const { x1, y1, x2, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return null; //should not really get here...
  }

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

        if(element.position === "inside"){
          setAction("moving");
        }else{
          setAction("resize");
        }
        
      }
    }else{
      // console.log(clientX, clientY)
      const id = elements.length;
      const newElement = createNewElement(id, clientX, clientY, clientX, clientY, tool);
      //useState
      setElements(prevState => [...prevState, newElement]);
      setSelectedElement(newElement);
      // console.log(elements);
      setAction('drawing');
    }
  };

  const handeMouseMove = (event) => {
    const {clientX, clientY} = event;


    if(tool === "selection"){
      const element = getElementAtPosition(clientX, clientY, elements);
      event.target.style.cursor = element ? cursorForPosition(element.position)  : "default";
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
    }if (action === "resize"){
      const {id, elementType, position,  ...coordinates} = selectedElement;
      const{x1, y1, x2, y2} = resizeCoordinates(clientX, clientY, position, coordinates);
      updateElement(id, x1, y1, x2, y2, elementType);
    }
  };

  const handeMouseUp = (event) => {
    const index = selectedElement.id;
    const{id, elementType} = elements[index];
    if(action === "drawing" || action === "resize"){
      const {x1, y1, x2, y2} = adjustElementCoordinates(elements[index]);
      updateElement(id, x1, y1, x2, y2, elementType);
    }
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
