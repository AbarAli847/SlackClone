export default function StatusBadge({ status }) {
  const style = () => {
    switch (status) {
      case 'New': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'Assigned': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'In Progress': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'Review': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Testing': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'Blocked': return 'bg-red-50 text-red-700 border-red-100';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Cancelled': return 'bg-gray-50 text-gray-400 border-gray-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold border ${style()}`}>
      {status}
    </span>
  );
}