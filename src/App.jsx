import React from 'react'
import PartOne from "./pages/PartOne"
import MqttPublisher from './components/mqtt/MqttPublisher'

const App = () => {
  return (
   <>
  <PartOne/>
  <MqttPublisher/>
   </>
  )
}

export default App