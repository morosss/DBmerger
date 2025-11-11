import { Link } from 'react-router-dom'
import { FolderPlus, Folders, Database, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getProjects } from '../services/storage'
import { Project } from '../types'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const allProjects = await getProjects()
    setProjects(allProjects.slice(0, 5)) // Show only recent 5
    setStats({
      total: allProjects.length,
      inProgress: allProjects.filter(p => p.status === 'in-progress').length,
      completed: allProjects.filter(p => p.status === 'completed').length
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to DBmerger - Manage your cardiovascular study databases
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/new-project"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
              <FolderPlus className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
              <p className="text-gray-600 text-sm">Start a new data matching project</p>
            </div>
          </div>
        </Link>

        <Link
          to="/projects"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Folders className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">View All Projects</h3>
              <p className="text-gray-600 text-sm">Access your existing projects</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Projects</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <Database className="h-12 w-12 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">In Progress</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.inProgress}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.completed}</p>
            </div>
            <Folders className="h-12 w-12 text-green-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
          <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No projects yet. Create your first project to get started.</p>
            <Link to="/new-project" className="btn-primary mt-4 inline-flex items-center">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{project.description || 'No description'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Create a new project and upload your index database (Excel/CSV)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Upload your target database template</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Select patients using filters or manual selection</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Match columns automatically or manually</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">5.</span>
              <span>Export the merged database</span>
            </li>
          </ul>
        </div>

        <div className="card bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">Features</h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              <span>AI-powered column matching with Claude Haiku</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              <span>Advanced filtering and patient selection</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              <span>Preserve Excel formatting in exports</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              <span>Client-side processing for data privacy</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2">✓</span>
              <span>Save and resume projects anytime</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
