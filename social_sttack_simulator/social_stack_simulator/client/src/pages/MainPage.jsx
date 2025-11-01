import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- SVG Icons ---

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const SalaryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const DeadlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const PostedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

// --- Sample Data Based on Screenshots ---

const opportunitiesData = [
  {
    id: 1,
    title: 'Frontend Developer',
    organization: 'TechCorp Inc.',
    type: 'job',
    location: 'Remote',
    salary: '$70,000 - $90,000/year',
    deadline: 'March 15, 2025',
    posted: '2 days ago',
    description: "We're looking for a talented frontend developer to join our growing team. Experience with React, TypeScript, and...",
  },
  {
    id: 2,
    title: 'Summer Software...',
    organization: 'Innovation Labs',
    type: 'internship',
    location: 'San Francisco, CA',
    salary: '$35/hour',
    deadline: 'February 28, 2025',
    posted: '1 week ago',
    description: 'Join our team for a 12-week summer internship. Work on real projects and gain hands-on experience with cutting...',
  },
  {
    id: 3,
    title: 'Merit-Based Academic...',
    organization: 'Future Scholars Foundation',
    type: 'scholarship',
    location: 'Nationwide',
    salary: '$10,000',
    deadline: 'April 1, 2025',
    posted: '3 days ago',
    description: 'Full scholarship for outstanding students pursuing STEM degrees. Renewable for up to 4 years based on academic...',
  },
  {
    id: 4,
    title: 'Data Analyst',
    organization: 'DataViz Solutions',
    type: 'job',
    location: 'New York, NY',
    salary: '$65,000 - $85,000/year',
    deadline: 'March 30, 2025',
    posted: '5 days ago',
    description: 'Analyze complex datasets and create compelling visualizations. Experience with Python, SQL, and Tableau preferred.',
  },
  {
    id: 5,
    title: 'Marketing Internship',
    organization: 'Brand Builders Co.',
    type: 'internship',
    location: 'Chicago, IL',
    salary: '$20/hour',
    deadline: 'March 10, 2025',
    posted: '1 day ago',
    description: 'Learn digital marketing strategies, social media management, and campaign analytics in a fast-paced environment.',
  },
  {
    id: 6,
    title: 'Women in Engineering...',
    organization: 'Tech Diversity Alliance',
    type: 'scholarship',
    location: 'International',
    salary: '$5,000',
    deadline: 'May 15, 2025',
    posted: '1 week ago',
    description: 'Supporting female students pursuing engineering degrees. Includes mentorship opportunities and...',
  },
  {
    id: 7,
    title: 'UX/UI Designer',
    organization: 'Creative Studios',
    type: 'job',
    location: 'Austin, TX',
    salary: '$75,000 - $95,000/year',
    deadline: 'April 5, 2025',
    posted: '4 days ago',
    description: 'Design beautiful and intuitive user interfaces. Portfolio showcasing mobile and web design work required.',
  },
  {
    id: 8,
    title: 'Research Assistant...',
    organization: 'University Research Lab',
    type: 'internship',
    location: 'Boston, MA',
    salary: '$18/hour',
    deadline: 'March 20, 2025',
    posted: '6 days ago',
    description: 'Assist with cutting-edge AI research. Great opportunity for students interested in pursuing graduate studies.',
  },
  {
    id: 9,
    title: 'First-Generation College...',
    organization: 'Education Access Fund',
    type: 'scholarship',
    location: 'Nationwide',
    salary: '$7,500',
    deadline: 'April 20, 2025',
    posted: '2 days ago',
    description: 'Financial support for first-generation college students demonstrating academic excellence and community...',
  },
];

// --- Helper Functions ---

const getTypeBadgeStyle = (type) => {
  const styles = {
    job: { backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' },
    internship: { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' },
    scholarship: { backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' },
    default: { backgroundColor: '#e2e8f0', color: '#1e293b', border: '1px solid #cbd5e1' }
  };
  
  const baseStyle = {
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'capitalize',
    whiteSpace: 'nowrap'
  };
  
  return { ...baseStyle, ...(styles[type] || styles.default) };
};

// --- Main Component ---

const MainPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredOpportunities = opportunitiesData.filter(opp => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || opp.type === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleApplyNow = (opportunityTitle) => {
    // Navigate to the apply page, passing the opportunity title as a query param
    navigate(`/apply?opportunity=${encodeURIComponent(opportunityTitle)}`);
  };
  
  const FilterButton = ({ type, label, icon }) => (
    <button
      onClick={() => setActiveFilter(type)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.25rem',
        border: '1px solid',
        borderColor: activeFilter === type ? '#3b82f6' : '#d1d5db',
        borderRadius: '8px',
        backgroundColor: activeFilter === type ? '#eff6ff' : 'white',
        color: activeFilter === type ? '#2563eb' : '#374151',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f9fafb' }}>
      
      {/* --- Header & Search --- */}
      <header style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', margin: '0 0 1rem 0' }}>
          Discover Your Next Opportunity
        </h1>
        <p style={{ fontSize: '1.125rem', opacity: 0.9, margin: '0 0 2rem 0' }}>
          Connect with top jobs, internships, and scholarships tailored for students
        </p>
        
        <div style={{
          display: 'flex',
          maxWidth: '700px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '1rem' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search for opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              border: 'none',
              borderRadius: '8px',
              outline: 'none',
              color: '#111827',
            }}
          />
          <button style={{
            padding: '0 1.5rem',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            backgroundColor: '#1d4ed8',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}>
            Search
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1.5rem',
          fontSize: '0.9rem',
        }}>
          <span style={{ opacity: 0.8 }}>Popular:</span>
          <a href="#" style={{ color: 'white', fontWeight: '500', textDecoration: 'none' }}>Software Engineering</a>
          <span style={{ opacity: 0.5 }}>•</span>
          <a href="#" style={{ color: 'white', fontWeight: '500', textDecoration: 'none' }}>Data Science</a>
          <span style={{ opacity: 0.5 }}>•</span>
          <a href="#" style={{ color: 'white', fontWeight: '500', textDecoration: 'none' }}>Research</a>
        </div>
      </header>
      
      {/* --- Main Content --- */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* --- Filter Tabs --- */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '0.5rem',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          maxWidth: 'max-content'
        }}>
          <FilterButton type="all" label="All Opportunities" icon="🌟" />
          <FilterButton type="job" label="Jobs" icon="💼" />
          <FilterButton type="internship" label="Internships" icon="🎓" />
          <FilterButton type="scholarship" label="Scholarships" icon="💡" />
        </div>

        {/* --- Results Count --- */}
        <p style={{
          fontSize: '1rem',
          color: '#4b5563',
          marginBottom: '1.5rem',
          fontWeight: '500'
        }}>
          Showing {filteredOpportunities.length} opportunities
        </p>

        {/* --- Opportunity Cards Grid --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}>
          {filteredOpportunities.map(opp => (
            <div 
              key={opp.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0, paddingRight: '1rem' }}>
                  {opp.title}
                </h3>
                <span style={getTypeBadgeStyle(opp.type)}>
                  {opp.type}
                </span>
              </div>
              
              <p style={{ color: '#3b82f6', fontWeight: '600', margin: '0 0 1rem 0', fontSize: '1rem' }}>
                {opp.organization}
              </p>
              
              <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '1.5rem', flex: 1, lineHeight: '1.5' }}>
                {opp.description}
              </p>

              <div style={{ 
                display: 'grid', 
                gap: '0.75rem', 
                marginBottom: '1.5rem', 
                fontSize: '0.9rem', 
                color: '#374151' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LocationIcon /> <span>{opp.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SalaryIcon /> <span>{opp.salary}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DeadlineIcon /> <span>Deadline: {opp.deadline}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PostedIcon /> <span>Posted {opp.posted}</span>
                </div>
              </div>

              <button
                onClick={() => handleApplyNow(opp.title)}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  fontSize: '1rem',
                  marginTop: 'auto'
                }}
              >
                View Details
              </button>
            </div>
          ))}
          
          {filteredOpportunities.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '4rem 1rem',
              color: '#6b7280',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}>
              <h3 style={{ margin: '0.5rem 0', color: '#111827', fontSize: '1.25rem' }}>
                No opportunities found
              </h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </main>
      
      {/* --- Footer --- */}
      <footer style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        marginTop: '3rem',
        borderTop: '1px solid #e5e7eb',
        color: '#6b7280',
        fontSize: '0.9rem',
      }}>
        © 2025 Student Opportunities. Connecting students with their future.
      </footer>
    </div>
  );
};

export default MainPage;
