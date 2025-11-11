import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewProject from './pages/NewProject'
import ProjectDetail from './pages/ProjectDetail'
import MyProjects from './pages/MyProjects'

function App() {
  return (
    <Router basename="/DBmerger">
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-project" element={<NewProject />} />
          <Route path="/projects" element={<MyProjects />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
