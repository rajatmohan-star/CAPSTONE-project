/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Lock } from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext.js';
import { GeneratedReport } from '../../types/workbench.js';

export const ReportsView: React.FC = () => {
  const { assignments } = useWorkbench();
  const [allReports, setAllReports] = useState<{ report: GeneratedReport; clientName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        const aggregated: { report: GeneratedReport; clientName: string }[] = [];
        for (const asn of assignments) {
          const res = await fetch(`/api/assignments/${asn.id}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.reports)) {
              for (const rpt of data.reports) {
                aggregated.push({ report: rpt, clientName: asn.clientName });
              }
            }
          }
        }
        aggregated.sort((a, b) => new Date(b.report.generatedAt).getTime() - new Date(a.report.generatedAt).getTime());
        setAllReports(aggregated);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllReports();
  }, [assignments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Generated Review Reports
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical repository of draft and certified final Excel workbooks produced by the AMRG Review Workbench.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading reports...</div>
      ) : allReports.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-semibold text-slate-800 mt-2">No reports generated yet</div>
          <p className="text-xs text-slate-400 mt-1">
            Run an onboarding review on any assignment to generate draft or final Excel workbooks.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Generated Date</th>
                <th className="py-3 px-3">Findings</th>
                <th className="py-3 px-3">Reviewer Approval</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allReports.map(({ report, clientName }) => (
                <tr key={report.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#0A7C3B]" />
                      <span className="font-semibold text-slate-900">{report.fileName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-medium">{clientName}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        report.type === 'Final'
                          ? 'bg-[#05466C] text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {report.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 font-mono">
                    {report.generatedAt.replace('T', ' ').substring(0, 16)}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-mono tabular-nums">
                    {report.findingsCount} findings
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    {report.reviewerApprovedBy ? (
                      <span className="text-[#0A7C3B] font-medium">
                        Approved by {report.reviewerApprovedBy}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium italic">Pending Reviewer</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={`/api/assignments/${report.assignmentId}/reports/${report.id}/download`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A7C3B] hover:bg-emerald-50 rounded border border-emerald-200 transition-colors"
                      download
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download .xlsx
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
