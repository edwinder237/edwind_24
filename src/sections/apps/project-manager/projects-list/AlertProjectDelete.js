import PropTypes from 'prop-types';

// project import
import DeleteCard from 'components/cards/DeleteCard';

// ==============================|| PROJECT - DELETE ||============================== //

export default function AlertProjectDelete({ title, open, handleClose }) {
  return (
    <DeleteCard
      open={open}
      onClose={() => handleClose(false)}
      onDelete={() => handleClose(true)}
      title="Are you sure you want to delete?"
      itemName={title}
      message={`By deleting "${title}" user, all task assigned to that user will also be deleted.`}
    />
  );
}

AlertProjectDelete.propTypes = {
  title: PropTypes.string,
  open: PropTypes.bool,
  handleClose: PropTypes.func
};
