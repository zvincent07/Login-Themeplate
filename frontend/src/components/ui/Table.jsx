/**
 * REUSABLE TABLE COMPONENT (Config-driven columns)
 * 
 * Usage:
 * <Table
 *   columns={[
 *     { key: 'name', label: 'Name', render: (item) => item.name },
 *     { key: 'email', label: 'Email', render: (item) => item.email },
 *     { key: 'actions', label: 'Actions', render: (item) => <Button>Edit</Button> }
 *   ]}
 *   data={users}
 *   loading={loading}
 *   emptyMessage="No users found"
 *   onRowClick={(item) => handleView(item)}
 *   selectable
 *   selectedRows={selectedIds}
 *   onSelectAll={handleSelectAll}
 *   onSelectRow={handleSelectRow}
 * />
 */

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectAll,
  onSelectRow,
  className = '',
  rowClassName = '',
  headerClassName = '',
}) => {
  const allSelected = selectable && data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectable && selectedRows.length > 0 && selectedRows.length < data.length;

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead className={`bg-gray-50 dark:bg-slate-700 ${headerClassName}`}>
          <tr>
            {selectable && (
              <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                  column.hidden ? 'hidden' : column.responsive || ''
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          {data.map((row, index) => {
            const isSelected = selectable && selectedRows.includes(row.id || row._id);
            return (
              <tr
                key={row.id || row._id || index}
                onClick={() => onRowClick?.(row)}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700' : ''}
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${rowClassName}
                `}
              >
                {selectable && (
                  <td
                    className="px-2 sm:px-4 py-2 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectRow?.(row, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-2 sm:px-4 py-2 whitespace-nowrap ${
                      column.hidden ? 'hidden' : column.responsive || ''
                    }`}
                  >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
