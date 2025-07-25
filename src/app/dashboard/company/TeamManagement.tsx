import React, { useState, useEffect } from 'react';
import { useGetTeamMembersQuery, useDeleteUserMutation } from '../../store/services/usersApi';
import AddTeamMemberModal from '@/app/components/company/AddTeamMemberModal';

const TeamManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: teamMembers, isLoading, error, refetch } = useGetTeamMembersQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [teamMemberCount, setTeamMemberCount] = useState(0);

  useEffect(() => {
    if (teamMembers) {
      setTeamMemberCount(teamMembers.length);
    }
  }, [teamMembers]);

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        await deleteUser(id).unwrap();
        refetch();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        Error loading team members. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Team Management
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your team members and their access to the platform
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Team Member
          </button>
        </div>
        {teamMembers && teamMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={String(member._id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteMember(String(member._id))}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500">
            No team members found. Add your first team member.
          </div>
        )}
      </div>

      <AddTeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />
    </>
  );
};

export default TeamManagement;