import React, { useEffect, useState } from 'react';
import { Transfer } from 'antd';
import {
  Button,
} from '@mui/material';

const TransferLists = ({ learners, enrolled,handleSelectedEnrollee }) => {
  const [targetKeys, setTargetKeys] = useState([]);
  
  const learnersList = learners?.map((person, i) => ({
    key: i.toString(),
    title: `${person.firstName} ${person.lastName}`,
    description: person.derpartement,
    chosen: enrolled.some(enrollee => enrollee.participantId === person.id),
    metaData:person
  }));


  const handleChange = (newTargetKeys) => {
    setTargetKeys(newTargetKeys);
    const selectedParticipants = learnersList.filter((person) => newTargetKeys.includes(person.key));
    const participantsMetaData = selectedParticipants.map((participant)=>participant.metaData);
    handleSelectedEnrollee(participantsMetaData);
  };

  const reset = () => {
    setTargetKeys([]);
  };

  useEffect(() => {
    // Populate initial data
    const tempTargetKeys = learnersList?.filter(person => person.chosen).map(person => person.key);
    setTargetKeys(tempTargetKeys);
  }, []);

  const renderFooter = (_, { direction }) => {
    return (
      <Button
        variant='contained'
        size="small"
        style={{
          float: direction === 'left' ? 'left' : 'right',
          margin: 5,
        }}
        onClick={reset}
      >
        Reset
      </Button>
    );
  };

  return (
    <Transfer
      operationStyle={{ backgroundColor: "" }}
      dataSource={learnersList}
      pagination={true}
      showSearch
      listStyle={{
        width: 300,
        height: 400,
        backgroundColor: "white"
      }}
      operations={['Enrol', 'Remove']}
      targetKeys={targetKeys}
      onChange={handleChange}
      render={(item) => `${item.title}-${item.description}`}
      footer={renderFooter}
    />
  );
};

export default TransferLists;
