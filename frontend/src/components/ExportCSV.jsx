import React from 'react';
import { Download } from 'lucide-react';

const ExportCSV = ({ data, filename, columns }) => {
    const handleExport = () => {
        if (!data || !data.length) return;

        let header = columns.map(c => c.label).join(',') + '\n';

        let rows = data.map(item => {
            return columns.map(c => {
                let val = c.value(item);
                // Escape commas and quotes for CSV
                if (typeof val === 'string') {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(',');
        }).join('\n');

        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            disabled={!data || data.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Download size={16} /> Export CSV
        </button>
    );
};

export default ExportCSV;
