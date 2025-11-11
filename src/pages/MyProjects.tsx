import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, FolderPlus, Search, Trash2, Calendar } from 'lucide-react'
import { getProjects, deleteProject } from '../services/storage'
import { Project } from '../types'

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'in-progress' | 'completed'>('all')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const allProjects = await getProjects()
      setProjects(allProjects)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      await deleteProject(projectId)
      setProjects(projects.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="mt-2 text-gray-600">Manage all your clinical data projects</p>
        </div>
        <Link to="/new-project" className="btn-primary flex items-center">
          <FolderPlus className="h-4 w-4 mr-2" />
          New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description..."
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="label">Filter by Status</label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-field"
            >
              <option value="all">All Projects</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card text-center py-12">
          <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first project to get started with data management'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <Link to="/new-project" className="btn-primary inline-flex items-center">
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <Link
                    to={`/project/${project.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {project.name}
                  </Link>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${
                  project.status === 'completed' ? 'bg-green-100 text-green-800' :
                  project.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description || 'No description provided'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-xs text-gray-500">
                  <Database className="h-3 w-3 mr-1" />
                  <span>
                    Index DB: {project.indexDatabase ? 'Uploaded' : 'Not uploaded'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Database className="h-3 w-3 mr-1" />
                  <span>
                    Target DB: {project.targetDatabase ? 'Uploaded' : 'Not uploaded'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>
                    Updated: {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <Link
                  to={`/project/${project.id}`}
                  className="flex-1 btn-primary text-center text-sm py-2"
                >
                  Open
                </Link>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="btn-secondary text-sm py-2 px-3 text-red-600 hover:bg-red-50"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && projects.length > 0 && (
        <div className="card bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-600">Total Projects</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'draft').length}
              </p>
              <p className="text-sm text-gray-600">Draft</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {projects.filter(p => p.status === 'in-progress').length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
