import React, { useState } from 'react';

export const RoleSearch = ({ handleRoleSearch }) => {
 
  return (
    <select 
      className="form-select"
      onChange={(e) => handleRoleSearch(e.target.value)}
      style={{ 
        backgroundColor: '#2d2d2d', 
        borderColor: 'rgba(16, 185, 129, 0.2)', 
        color: '#fff',
        backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3e%3cpath fill=\'none\' stroke=\'%2310b981\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'m2 5 6 6 6-6\'/%3e%3c/svg%3e")'
      }}
    >
      <option value="" style={{ backgroundColor: '#2d2d2d', color: '#fff' }}>All Roles</option>
      <option value="admin" style={{ backgroundColor: '#2d2d2d', color: '#fff' }}>Admin</option>
      <option value="manager" style={{ backgroundColor: '#2d2d2d', color: '#fff' }}>Manager</option>
      <option value="trainer" style={{ backgroundColor: '#2d2d2d', color: '#fff' }}>Trainer</option>
      <option value="trainee" style={{ backgroundColor: '#2d2d2d', color: '#fff' }}>Trainee</option>
    </select>
  );
};