"use client"
import React from 'react';

/**
 * Main application component.
 * This component renders a project dashboard with multiple cards
 * displaying project details, status, timeline, meetings, and links.
 */
export default function App() {
  // Data for the stage progress cards
  const stages = [
    { name: 'Discovery', progress: 100, color: 'bg-green-500' },
    { name: 'Planning', progress: 50, color: 'bg-blue-500' },
    { name: 'Design', progress: 10, color: 'bg-blue-500' },
    { name: 'Development', progress: 0, color: 'bg-gray-500' },
    { name: 'Testing', progress: 0, color: 'bg-gray-500' },
    { name: 'Deployment', progress: 0, color: 'bg-gray-500' },
  ];

  return (
    // Main container
    <div className="min-h-screen w-screen bg-black p-8 pb-16 text-white">
      {/* Project Title */}
      <h1 className="mb-8 text-5xl font-bold text-white">
        Project Name
      </h1>

      {/* Grid container for layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (takes 2 spans on large screens) */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          {/* Project Overview Card */}
          <div className="w-full rounded-lg bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-white">
              Project Overview
            </h2>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-300">
                  Description
                </h3>
                <p className="text-gray-400">dc</p>
                <p className="text-gray-400">cd</p>
                <p className="text-gray-400">cdscd</p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-gray-300">
                  Objectives
                </h3>
                <p className="text-gray-400">[Objectives go here]</p>
              </div>
            </div>
          </div>

          {/* Project Status Card (MOVED HERE) */}
          <div className="w-full rounded-lg bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-white">
              Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="font-medium text-gray-200">a</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-medium text-yellow-400">
                  requested — 0%
                </span>
              </div>

              {/* Stage Section with Progress Cards */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-300">
                  Stage
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {stages.map((stage) => (
                    <div
                      key={stage.name}
                      className="rounded-lg bg-gray-800 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-200">
                          {stage.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {stage.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div
                          className={`h-2 rounded-full ${stage.color}`}
                          style={{ width: `${stage.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Timeline:</span>
                <span className="font-medium text-gray-200">
                  2025-11-10 → 2025-11-19
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Approved:</span>
                <span className="font-medium text-red-400">No</span>
              </div>
            </div>
          </div>

          {/* Links Card (MOVED HERE) */}
          <div className="w-full rounded-lg bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-white">
              Links
            </h2>
            <div className="flex flex-col gap-6">
              {/* Filebase Links */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-300">
                  Filebase
                </h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#"
                    className="rounded-lg bg-gray-800 p-3 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                  >
                    Project Drive
                  </a>
                  <a
                    href="#"
                    className="rounded-lg bg-gray-800 p-3 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                  >
                    Design Assets
                  </a>
                </div>
              </div>

              {/* Credential Links */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-300">
                  Credential
                </h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#"
                    className="rounded-lg bg-gray-800 p-3 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                  >
                    Dev Passwords
                  </a>
                </div>
              </div>

              {/* Other Links */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-300">
                  Other
                </h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="#"
                    className="rounded-lg bg-gray-800 p-3 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                  >
                    Trello Board
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (takes 1 span on large screens) */}
        <div className="flex flex-col gap-8">
          {/* Timeline & Milestones Card */}
          <div className="w-full rounded-lg bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-6 text-2xl font-semibold text-white">
              Timeline & Milestones
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-lg font-medium text-gray-300">
                  Total cost
                </h3>
                <p className="text-gray-400">0</p>
              </div>
              <div>
                <h3 className="mb-1 text-lg font-medium text-gray-300">
                  Milestones
                </h3>
                <p className="text-gray-400">No milestones yet</p>
              </div>
            </div>
          </div>

          {/* Meetings Card (MOVED HERE) */}
          <div className="w-full rounded-lg bg-gray-900 p-6 shadow-lg">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h2 className="text-2xl font-semibold text-white">
                Meetings
              </h2>
              <button className="flex-shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                Request Meeting
              </button>
            </div>
            <div className="mt-6 space-y-3 rounded-lg bg-gray-800 p-4">
              <h4 className="font-semibold text-gray-300">
                Discovery: dc — discovery — Status: requested
              </h4>
              <p className="text-sm text-gray-400">
                <span className="font-medium text-gray-300">Scheduled:</span> Not
                scheduled
              </p>
              <p className="text-sm text-gray-400">
                <span className="font-medium text-gray-300">Link:</span> —
              </p>
              <p className="text-sm text-gray-400">
                <span className="font-medium text-gray-300">Requested by:</span>{' '}
                Demo Admin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}