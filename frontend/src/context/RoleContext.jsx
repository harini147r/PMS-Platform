import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const ROLES = {
  ADMIN: {
    id: 'admin',
    name: 'Dr. Sivasubramaniam',
    title: 'Head of Placement (Admin)',
    description: 'Full system oversight, lead approval, student records, and company matching.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  TEAM_MEMBER: {
    id: 'team_member',
    name: 'Team Member 1',
    title: 'Placement Team Member',
    description: 'Manage assigned leads, follow-ups, upload JDs, and record completed drives.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  MANAGER: {
    id: 'manager',
    name: 'Dr. Jeyakannan',
    title: 'Placement Manager',
    description: 'Student overview, department analytics, and placement records.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
};

export const RoleProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(ROLES.ADMIN);

  const switchRole = (roleKey) => {
    if (ROLES[roleKey]) {
      setCurrentRole(ROLES[roleKey]);
    }
  };

  return (
    <RoleContext.Provider value={{ currentRole, switchRole, ROLES }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
