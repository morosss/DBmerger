import localforage from 'localforage'
import { Project } from '../types'

// Configure localforage
localforage.config({
  name: 'ClinicalDataManager',
  storeName: 'projects',
  description: 'Storage for clinical data management projects'
})

const PROJECTS_KEY = 'projects_list'

// Get all projects
export async function getProjects(): Promise<Project[]> {
  try {
    const projects = await localforage.getItem<Project[]>(PROJECTS_KEY)
    return projects || []
  } catch (error) {
    console.error('Failed to get projects:', error)
    return []
  }
}

// Get a single project by ID
export async function getProject(id: string): Promise<Project | null> {
  try {
    const projects = await getProjects()
    return projects.find(p => p.id === id) || null
  } catch (error) {
    console.error('Failed to get project:', error)
    return null
  }
}

// Create a new project
export async function createProject(data: { name: string; description?: string }): Promise<Project> {
  try {
    const projects = await getProjects()
    const newProject: Project = {
      id: generateId(),
      name: data.name,
      description: data.description,
      status: 'draft',
      aiMatchUsageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    projects.push(newProject)
    await localforage.setItem(PROJECTS_KEY, projects)
    return newProject
  } catch (error) {
    console.error('Failed to create project:', error)
    throw error
  }
}

// Update an existing project
export async function updateProject(updatedProject: Project): Promise<void> {
  try {
    const projects = await getProjects()
    const index = projects.findIndex(p => p.id === updatedProject.id)
    if (index === -1) {
      throw new Error('Project not found')
    }
    updatedProject.updatedAt = new Date()
    projects[index] = updatedProject
    await localforage.setItem(PROJECTS_KEY, projects)
  } catch (error) {
    console.error('Failed to update project:', error)
    throw error
  }
}

// Delete a project
export async function deleteProject(id: string): Promise<void> {
  try {
    const projects = await getProjects()
    const filtered = projects.filter(p => p.id !== id)
    await localforage.setItem(PROJECTS_KEY, filtered)
  } catch (error) {
    console.error('Failed to delete project:', error)
    throw error
  }
}

// Generate a unique ID
function generateId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
