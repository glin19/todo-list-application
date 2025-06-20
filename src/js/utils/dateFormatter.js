export const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

export const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
};