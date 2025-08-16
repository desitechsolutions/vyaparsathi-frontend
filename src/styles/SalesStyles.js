const customStyles = {
  control: (provided) => ({
    ...provided,
    fontSize: { xs: '0.75rem', md: '0.85rem' },
    marginBottom: '1rem',
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: 200,
    overflowY: 'auto',
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: { xs: '0.75rem', md: '0.85rem' },
    color: state.isSelected
      ? '#fff'
      : state.data.value === ''
      ? '#6b7280'
      : '#111827',
    backgroundColor: state.isSelected
      ? '#3b82f6'
      : state.isFocused
      ? '#e5e7eb'
      : 'white',
  }),
  singleValue: (provided, state) => ({
    ...provided,
    color: state.data.value === '' ? '#6b7280' : '#111827',
  }),
};

export default customStyles;