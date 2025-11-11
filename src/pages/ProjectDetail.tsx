import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Users, Columns, Download, Save } from 'lucide-react'
import { getProject, updateProject } from '../services/storage'
import { Project } from '../types'
import FileUpload from '../components/FileUploadEnhanced'
import PatientSelection from '../components/PatientSelection'
import ColumnMatching from '../components/ColumnMatching'
import DataExport from '../components/DataExport'

type WorkflowStep = 'upload' | 'selection' | 'matching' | 'export'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProject()
  }, [id])

  const loadProject = async () => {
    if (!id) return
    setLoading(true)
    try {
      const proj = await getProject(id)
      if (!proj) {
        navigate('/projects')
        return
      }
      setProject(proj)
      // Determine current step based on project state
      if (!proj.indexDatabase || !proj.targetDatabase) {
        setCurrentStep('upload')
      } else if (!proj.patientSelection) {
        setCurrentStep('selection')
      } else if (!proj.columnMatching) {
        setCurrentStep('matching')
      } else {
        setCurrentStep('export')
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProject = async () => {
    if (!project) return
    setSaving(true)
    try {
      await updateProject(project)
      alert('Project saved successfully!')
    } catch (error) {
      console.error('Failed to save project:', error)
      alert('Failed to save project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const steps = [
    { id: 'upload', label: 'Upload Databases', icon: Upload, enabled: true },
    { id: 'selection', label: 'Patient Selection', icon: Users, enabled: !!project?.indexDatabase && !!project?.targetDatabase },
    { id: 'matching', label: 'Column Matching', icon: Columns, enabled: !!project?.patientSelection },
    { id: 'export', label: 'Export Data', icon: Download, enabled: !!project?.columnMatching },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="spinner" />
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/projects')}
            className="btn-secondary mr-4 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-gray-600">{project.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleSaveProject}
          disabled={saving}
          className="btn-primary flex items-center"
        >
          {saving ? (
            <>
              <div className="spinner mr-2" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </>
          )}
        </button>
      </div>

      {/* Workflow Steps */}
      <div className="card">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index
            const isEnabled = step.enabled

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => isEnabled && setCurrentStep(step.id as WorkflowStep)}
                  disabled={!isEnabled}
                  className={`flex flex-col items-center p-4 rounded-lg transition-colors flex-1 ${
                    isActive ? 'bg-primary-50 border-2 border-primary-500' :
                    isCompleted ? 'bg-green-50 border-2 border-green-500' :
                    isEnabled ? 'hover:bg-gray-50 cursor-pointer' :
                    'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`p-3 rounded-full mb-2 ${
                    isActive ? 'bg-primary-600' :
                    isCompleted ? 'bg-green-600' :
                    'bg-gray-300'
                  }`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-primary-900' :
                    isCompleted ? 'text-green-900' :
                    'text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`h-1 w-full mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="card">
        {currentStep === 'upload' && (
          <FileUpload project={project} onUpdate={setProject} />
        )}
        {currentStep === 'selection' && (
          <PatientSelection project={project} onUpdate={setProject} onNext={() => setCurrentStep('matching')} />
        )}
        {currentStep === 'matching' && (
          <ColumnMatching project={project} onUpdate={setProject} onNext={() => setCurrentStep('export')} />
        )}
        {currentStep === 'export' && (
          <DataExport project={project} />
        )}
      </div>
    </div>
  )
}
