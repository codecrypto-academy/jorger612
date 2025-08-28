import {useEffect, useState} from 'react'
import { createRoot } from 'react-dom/client'
const root = document.getElementById('root');
const rootReact = createRoot(root)

const useContador = (numero) => {
  const [c,setC] = useState(numero);
  const incrementar = () => setC(c + 1);
  const decrementar = () => setC(c - 1);
  const reset = () => setC(numero);
  return{
    c,
    incrementar,
    decrementar,
    reset   
  }
}
const App = () => {
  const {c: contador,incrementar,decrementar,reset} = useContador(67)
  const {c: contador1,incrementar:inc1,decrementar:dec1,reset:reset1} = useContador(76)

return <div>
    {contador}
    <button onClick={()=> incrementar()}>Incrementar</button>
    <button onClick={()=> decrementar()}>Decrementar</button>
    <button onClick={()=> reset()}>Reset</button>     
    <hr></hr>
    {contador1}
    <button onClick={()=> inc1()}>Incrementar 2</button>
    <button onClick={()=> dec1()}>Decrementar 2</button>
    <button onClick={()=> reset1()}>Reset 2</button>     
    
    </div>
}

rootReact.render(
  <App></App>
)
