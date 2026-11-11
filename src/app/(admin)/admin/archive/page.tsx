"use client";

import { PhotoLibrary } from "../folders/[folderId]/PhotoLibrary";

export default function ArchivePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl italic">Archive</h1>
        <p className="mt-1 text-sm text-muted">
          The public gallery shown at <code>/archive</code>. Manage tags, or
          move/delete photos out of it, below.
        </p>
      </div>

      <PhotoLibrary folderId="public" />
    </div>
  );
}
