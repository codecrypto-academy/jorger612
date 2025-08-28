import { createContext, useState, useContext, useEffect } from 'react';
import { createRoot } from 'react-dom/client'

const root = document.getElementById('root');
const rootReact = createRoot(root)
const GlobalContext = createContext();

const AppGlobal = ({children}) => {
    const [estado, setEstado] = useState({
      usuario: "Usu1"
    })

    useEffect(() => {
       console.log("Global")
    })  


    return <GlobalContext.Provider value={[estado, setEstado]}>
      {children}
    </GlobalContext.Provider>
  }    

const Hijo = () => {
  
  const [context, setContext] = useContext(GlobalContext)
  
      useEffect(() => {
       console.log("Hijo")
    })  

  return <div>
    USU:{context.usuario}
  </div>
}

const Nieto = () => {
  const [context, setContext] = useContext(GlobalContext)
  const cambiar = () => {
    setContext({...context, usuario: "Usu2Nuevo"})
  }

    useEffect(() => {
       console.log("Nieto")
    })  

  return <div>
    Soy el Nieto USU:{context.usuario}
    <button onClick={() => {cambiar()}}>Cambiar Usuario</button>
  </div>
}


rootReact.render(
  <AppGlobal>
    <h1>Hola</h1>
    <h1>Hola Otra vez</h1>
    <Hijo/>
    <Nieto/>
  </AppGlobal>
)
