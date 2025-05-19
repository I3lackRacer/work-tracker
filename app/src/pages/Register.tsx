import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { register, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await register(username, password)
    if (success) {
      navigate('/login')
    }
  }

  return (
    <div className="h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
      <a
        href="https://github.com/I3lackRacer/work-tracker"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 text-gray-500 hover:text-gray-400 text-sm transition-colors duration-200"
      >
        Made by @I3lackRacer
      </a>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Start tracking your work hours today
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Create Account
            </button>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                Already have an account? Sign in here
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register 