import React, { useState } from 'react';

export const RoleSearch = ({ handleRoleSearch }) => {
 
  return (
    <select 
      className="form-select"
      onChange={(e) => handleRoleSearch(e.target.value)}
    >
      <option value="">Όλοι οι Ρόλοι</option>
      <option value="1">Επικεφαλής</option>
      <option value="2">Διαχειριστής</option>
      <option value="3">Χρήστης</option>
    </select>
  );
};