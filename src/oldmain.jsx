import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CompA from './compoA.jsx'
import {CompB} from './compoB.jsx'


/*function Comp1(){
  return <h2>"Hola Mundo desde Componente 1"</h2>  
}

const Comp2 = () => {
  return "Hola Mundo desde Componente 2"
}


const Compo2 = (props)=> {
  return <p>{props.b}</p>
}

const Compo = (props)=> {
  return <p>{props.a}-{props.b}<Compo2 b={props.b+10}></Compo2></p>
}
*/


//createRoot(document.getElementById('root')).render(
const root = document.getElementById('root');
const rootReact = createRoot(root)

function Likes(props) {
 let likes= 0;
 function increment(){
 likes = likes+ 1;
 console.log(likes);
 }
 return<button onClick={() =>increment()}>Like{likes}</button>
 }
 
  const Likes2 = (props) => {
      const[likes2, setLikes2] = useState(10);
      console.log('Render', likes2)
      const increment2 = () => {
        setLikes2(likes2 + 1)
        console.log(likes2)
      }
      return <button onClick={() => increment2()}>Like2 {likes2}</button>
  } 
  rootReact.render(
 <div>
 <Likes/>
 <Likes2/>
 </div>
 )


/*const fnulo = () => "Todo"
const farr = () => [1, 2, 3, 4, [1,"todo"]]
const C1 = (props) => <p>Hola props</p>
const lista = ["Valencia","Alicante","Madrid"]*/
/*const sesion = {
  usuario: null
}*/
//const sesion = null;
//-----rootReact.render(
/*<h1>
  Hola Mundo react<Comp1></Comp1>
  <Comp2></Comp2>
  </h1>
  <h1>
    <Compo a= {"1"} b={3+5+6}></Compo>
    <Compo a= {"2"} b={2+5+6}></Compo>
    <Compo a= {"3"} b={1+5+6}></Compo>
  </h1>*/
  /*<h1>
    Hello <CompA b="2"></CompA>
    <CompB b= {33}></CompB>
  </h1>*/
  /*<h1>
    {2+4}
    {fnulo()}
    {farr()}
    {<C1></C1>}
  </h1>*/
  /*<div>
    <ul>
      {
       lista.map((i, contador) => <li key={contador}>{i}</li>)
      } 
    </ul>
  </div>*/
/*  <div>
    {sesion && <p>{sesion.usuario}</p>}
  </div>*/
  /*  <div>
    {sesion ? <p>{sesion.usuario}</p> : <p>Ir al Login</p>}
  </div>*/

//)
