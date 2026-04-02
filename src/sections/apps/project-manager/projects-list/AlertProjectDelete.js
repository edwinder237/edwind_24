import PropTypes from 'prop-types';

// project import
import DeleteCard from 'components/cards/DeleteCard';

// ==============================|| PROJECT - DELETE ||============================== //

export default function AlertProjectDelete({ title, open, handleClose, isAdmin }) {
  if (isAdmin) {
    return (
      <DeleteCard
        open={open}
        onClose={() => handleClose(false)}
        onDelete={() => handleClose('delete')}
        onArchive={() => handleClose('archive')}
        showArchive
        title="Archive or Delete Project?"
        itemName={title}
        message={`Archiving "${title}" will hide it from active views. You can restore it later. Permanently deleting will remove the project and all related data.`}
        deleteLabel="Permanently Delete"
        archiveLabel="Archive"
      />
    );
  }

  return (
    <DeleteCard
      open={open}
      onClose={() => handleClose(false)}
      onDelete={() => handleClose('archive')}
      title="Archive Project?"
      itemName={title}
      message={`Archiving "${title}" will hide it from active views. You can restore it later.`}
      deleteLabel="Archive"
    />
  );
}

AlertProjectDelete.propTypes = {
  title: PropTypes.string,
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  isAdmin: PropTypes.bool
};
