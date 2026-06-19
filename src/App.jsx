// import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Start from "./layout/Start";
import Random from "./layout/Random";
import Register from "./layout/Register";
import Detail from "./layout/Detail";
import My from "./layout/My";
import Bookmark from "./layout/Bookmark";

function App() {
  // UI
  return (
    <BrowserRouter basename="/ShareYourRecipe/">
      <div>
        <Routes>
          <Route path='/' element={<Start />} />
          <Route path='/random' element={<Random />} />
          <Route path='/register' element={<Register />} />
          <Route path='/detail' element={<Detail />} />
          <Route path='/my' element={<My />} />
          <Route path='/bookmarks' element={<Bookmark />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App