import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check, Loader2, Camera } from 'lucide-react';
import { userApi, chatApi, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  username?: string;
  profilePicture?: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (chat: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const [step, setStep] = useState<'members' | 'details'>(1 === 1 ? 'members' : 'details');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep('members');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setGroupName('');
      setGroupDescription('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await userApi.searchUsers(searchQuery);
        setSearchResults(response.data.data);
      } catch (err) {
        console.error(getErrorMessage(err));
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleNext = () => {
    if (selectedUsers.length === 0) {
      setError('Select at least one member');
      return;
    }
    setError('');
    setStep('details');
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await chatApi.createChat({
        type: 'group',
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        participantIds: selectedUsers.map((u) => u.id),
      });
      onGroupCreated(response.data.data);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#17212b] rounded-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#0e1621]">
          <div className="flex items-center gap-3">
            <button
              onClick={step === 'details' ? () => setStep('members') : onClose}
              className="p-1 rounded-lg hover:bg-[#232e3c] transition-colors"
            >
              <X className="w-5 h-5 text-[#aaaaaa]" />
            </button>
            <h2 className="text-white font-medium">
              {step === 'members' ? 'Add Members' : 'New Group'}
            </h2>
          </div>
          {step === 'members' && selectedUsers.length > 0 && (
            <button
              onClick={handleNext}
              className="text-[#3390ec] font-medium hover:text-[#5eb5f7] transition-colors"
            >
              Next
            </button>
          )}
          {step === 'details' && (
            <button
              onClick={handleCreate}
              disabled={isCreating || !groupName.trim()}
              className="text-[#3390ec] font-medium hover:text-[#5eb5f7] transition-colors disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create'}
            </button>
          )}
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        {step === 'members' ? (
          <>
            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="p-3 border-b border-[#0e1621] flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 bg-[#3390ec]/20 text-[#3390ec] px-3 py-1.5 rounded-full text-sm"
                  >
                    <span>{user.name}</span>
                    <button onClick={() => toggleUser(user)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="p-3 border-b border-[#0e1621]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#242f3d] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-[#6c7883] focus:outline-none text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#3390ec] animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((user) => {
                    const isSelected = selectedUsers.some((u) => u.id === user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleUser(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#232e3c] transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3390ec] to-[#5eb5f7] flex items-center justify-center">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-medium text-sm">{getInitials(user.name)}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium">{user.name}</p>
                          {user.username && <p className="text-[#6c7883] text-sm">@{user.username}</p>}
                        </div>
                        <div className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                          isSelected ? 'bg-[#3390ec] border-[#3390ec]' : 'border-[#6c7883]'
                        )}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-8 text-center text-[#6c7883]">No users found</div>
              ) : (
                <div className="py-8 text-center text-[#6c7883]">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Search for users to add</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 space-y-4">
            {/* Group Photo */}
            <div className="flex justify-center">
              <button className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#3390ec] to-[#5eb5f7] flex items-center justify-center hover:opacity-90 transition-opacity">
                <Users className="w-10 h-10 text-white" />
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#232e3c] flex items-center justify-center border-2 border-[#17212b]">
                  <Camera className="w-4 h-4 text-[#6c7883]" />
                </div>
              </button>
            </div>

            {/* Group Name */}
            <div>
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-[#242f3d] rounded-xl px-4 py-3 text-white placeholder-[#6c7883] focus:outline-none focus:ring-1 focus:ring-[#3390ec]"
                autoFocus
              />
            </div>

            {/* Group Description */}
            <div>
              <textarea
                placeholder="Description (optional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#242f3d] rounded-xl px-4 py-3 text-white placeholder-[#6c7883] focus:outline-none focus:ring-1 focus:ring-[#3390ec] resize-none"
              />
            </div>

            {/* Selected Members */}
            <div>
              <p className="text-[#6c7883] text-sm mb-2">{selectedUsers.length} members</p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 bg-[#232e3c] px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3390ec] to-[#5eb5f7] flex items-center justify-center">
                      <span className="text-white text-xs">{getInitials(user.name)}</span>
                    </div>
                    <span className="text-white text-sm">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
