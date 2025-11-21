import { getUserFromRequestAsync } from '../../../../lib/auth';
import connectToDatabase from '../../../../lib/mongodb';
import ProjectDetailsClient from './ProjectDetails.client';
import { ObjectId } from 'mongodb';
import { redirect } from 'next/navigation';
import { sanitizeDoc } from '../../../../lib/sanitize';

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  // Use JWT from Authorization header (SSR context should pass it)
  const user = await getUserFromRequestAsync({ headers: { authorization: '' } }); // TODO: Pass JWT from SSR context
  if (!user || !user.userId) {
    redirect('/auth/login');
  }
  const userId = user.userId;
  const tenantId = user.tenantId;
  const userRole = user.role;

  const { db } = await connectToDatabase();

  // Resolve ObjectId safely
  let projId: any = null;
  try { projId = new ObjectId(id as string); } catch (e) { projId = null; }

  let project: any = null;
  if (projId && tenantId) {
    project = await db.collection('projects').findOne({ _id: projId, tenantId });
  } else if (projId) {
    const found = await db.collection('projects').findOne({ _id: projId });
    if (found && (found.author?.id === userId || userRole === 'admin' || userRole === 'staff')) {
      project = found;
    }
  }

  if (!project) {
    if (tenantId) {
      project = await db.collection('projects').findOne({ id: id as any, tenantId });
    } else {
      const foundByString = await db.collection('projects').findOne({ id: id as any });
      if (foundByString && (foundByString.author?.id === userId || userRole === 'admin' || userRole === 'staff')) {
        project = foundByString;
      }
    }
  }

  const initialProject = project ? sanitizeDoc(project) : null;

  return (
    // Server -> Client boundary: initialProject is sanitized and JSON-safe
    <ProjectDetailsClient projectId={id} initialProject={initialProject} />
  );
}

