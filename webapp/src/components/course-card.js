export default function CourseCard({ title }) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors cursor-pointer">
        <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
        <p className="text-gray-400">Description</p>
      </div>
    )
  }
  
  