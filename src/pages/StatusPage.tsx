import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { StatusList } from '@/components/status/StatusList';
import { StatusViewer } from '@/components/status/StatusViewer';
import { CreateStatusDialog } from '@/components/status/CreateStatusDialog';
import { useStatus, UserStatus } from '@/hooks/useStatus';
import { useAuth } from '@/contexts/AuthContext';

export default function StatusPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statuses, myStatuses, createStatus, viewStatus } = useStatus();
  const [viewingStatus, setViewingStatus] = useState<UserStatus | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleViewStatus = (userStatus: UserStatus, index: number) => {
    setViewingStatus(userStatus);
    setViewingIndex(index);
  };

  const handleCreateStatus = async (content: string, type: 'text' | 'image' | 'video') => {
    await createStatus(content, type);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/chat')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Status</h1>
      </div>

      {/* Status List */}
      <StatusList
        statuses={statuses}
        myStatuses={myStatuses}
        onViewStatus={handleViewStatus}
        onCreateStatus={() => setCreateDialogOpen(true)}
        currentUserId={user?.id || ''}
        currentUserAvatar={user?.avatar_url || ''}
        currentUserName={user?.name || 'You'}
      />

      {/* Status Viewer */}
      <StatusViewer
        userStatus={viewingStatus}
        initialIndex={viewingIndex}
        onClose={() => setViewingStatus(null)}
        onView={viewStatus}
      />

      {/* Create Status Dialog */}
      <CreateStatusDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateStatus}
      />
    </div>
  );
}
