import React, { useState } from 'react';

const VoicemailFilters = ({ filters, onFilterChange }) => {
  const [phoneFilter, setPhoneFilter] = useState(filters.phone || '');
  
  // Handle status change
  const handleStatusChange = (e) => {
    onFilterChange({
      ...filters,
      status: e.target.value
    });
  };
  
  // Handle phone filter change
  const handlePhoneChange = (e) => {
    setPhoneFilter(e.target.value);
  };
  
  // Handle phone filter submit
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    onFilterChange({
      ...filters,
      phone: phoneFilter
    });
  };
  
  // Clear phone filter
  const handleClearPhone = () => {
    setPhoneFilter('');
    onFilterChange({
      ...filters,
      phone: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
      <div>
        <label htmlFor="status-filter" style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
          Status
        </label>
        <select 
          id="status-filter"
          value={filters.status || 'new'}
          onChange={handleStatusChange}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            minWidth: '120px'
          }}
        >
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
          <option value="deleted">Deleted</option>
          <option value="">All</option>
        </select>
      </div>
      
      <div>
        <form onSubmit={handlePhoneSubmit} style={{ display: 'flex' }}>
          <div>
            <label htmlFor="phone-filter" style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
              Phone Number
            </label>
            <input 
              id="phone-filter"
              type="text"
              value={phoneFilter}
              onChange={handlePhoneChange}
              placeholder="Search by phone"
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                width: '160px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', marginLeft: '8px', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                height: '38px'
              }}
            >
              Search
            </button>
            
            {filters.phone && (
              <button
                type="button"
                onClick={handleClearPhone}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  marginLeft: '8px',
                  cursor: 'pointer',
                  height: '38px'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoicemailFilters;