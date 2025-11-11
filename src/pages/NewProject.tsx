import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderPlus } from 'lucide-react'
import { createProject } from '../services/storage'

export default function NewProject() {
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    setLoading(true)
    try {
      const project = await createProject({
        name: projectName.trim(),
        description: description.trim() || undefined
      })
      navigate(`/project/${project.id}`)
    } catch (err) {
      setError('Failed to create project. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
        <p className="mt-2 text-gray-600">
          Start a new data matching project for your clinical study
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="projectName" className="label">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., TAVI Study 2024"
              className="input-field"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Choose a descriptive name for your project
            </p>
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this project, study objectives, or any notes..."
              rows={4}
              className="input-field resize-none"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Provide additional context about this project
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Info Section */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Next Steps</h3>
        <p className="text-sm text-blue-800 mb-3">
          After creating your project, you'll be able to:
        </p>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <span>Upload your index database containing patient records</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <span>Upload your target database template for the study</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <span>Select patients using advanced filters or manual selection</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">4.</span>
            <span>Map columns automatically using AI or manually</span>
          </li>
          <li className="flex items-start">
            <span className="font-semibold mr-2">5.</span>
            <span>Export the merged database with preserved formatting</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
