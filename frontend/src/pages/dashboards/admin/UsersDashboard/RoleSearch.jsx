import React, { useState } from 'react';

export const RoleSearch = ({ handleRoleSearch }) => {
 
  return (
    <select 
      className="form-select"
      onChange={(e) => handleRoleSearch(e.target.value)}
    >
      <option value="">All Roles</option>
      <option value="admin">Admin</option>
      <option value="manager">Manager</option>
      <option value="trainer">Trainer</option>
      <option value="trainee">Trainee</option>
    </select>
  );
};