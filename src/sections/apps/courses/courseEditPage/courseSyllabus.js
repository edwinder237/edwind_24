import React from 'react';
import { styled } from '@mui/material/styles';

const Container = styled('div')({
  backgroundColor: '#fff',
  margin: 0,
  padding: 0,
  WebkitTextSizeAdjust: 'none',
  textAdjust: 'none',
});

const Header = styled('div')({
  backgroundColor: '#6cb2f6',
  backgroundImage: "url('https://d1oco4z2z1fhwp.cloudfront.net/templates/default/1711/memphis_black_right.png')",
  backgroundPosition: 'top center',
  backgroundRepeat: 'no-repeat',
});

const Title = styled('div')({
  color: '#ffffff',
  fontFamily: 'Merriweather, Georgia, serif',
  fontSize: '30px',
  lineHeight: '150%',
  textAlign: 'center',
  msoLineHeightAlt: '45px',
  padding: '15px 40px',
});

const Section = styled('div')({
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  color: '#000',
});

const SubTitle = styled('div')({
  fontFamily: 'Merriweather, Georgia, serif',
  fontSize: '18px',
  lineHeight: '150%',
  textAlign: 'left',
  msoLineHeightAlt: '27px',
  paddingLeft: '15px',
  paddingRight: '10px',
  paddingTop: '23px',
});

const TextContent = styled('div')({
  fontFamily: 'Merriweather, Georgia, serif',
  fontSize: '15px',
  lineHeight: '150%',
  textAlign: 'left',
  msoLineHeightAlt: '22.5px',
  color: '#555555',
  paddingBottom: '10px',
  paddingLeft: '15px',
  paddingRight: '15px',
  paddingTop: '10px',
});

const Image = styled('img')({
  display: 'block',
  height: 'auto',
  border: 0,
  maxWidth: '198.33333333333331px',
  width: '100%',
});

const Icon = styled('img')({
  display: 'block',
  height: 'auto',
  border: 0,
});

const CourseSyllabus = () => {
  return (
    <Container>
      <Header>
        <Title>
          <strong>Course Syllabus</strong>
        </Title>
      </Header>
      <Section>
        <SubTitle>
          <span style={{ color: '#0075ff' }}><strong>Instructor</strong></span>
        </SubTitle>
        <TextContent>
          <span style={{ color: '#2b3940' }}><strong>Mark John Doe</strong></span>
        </TextContent>
        <TextContent>
          <span style={{ fontSize: '14px', fontFamily: 'Merriwheater, Georgia, serif', msoLineHeightAlt: '21px', color: '#555555', lineHeight: '1.5' }}>
            Sesame snaps topping chupa chups gingerbread pie.
          </span>
        </TextContent>
      </Section>
      <Section>
        <SubTitle>
          <span style={{ color: '#0075ff' }}><strong>REQUIREMENTS</strong></span>
        </SubTitle>
        <TextContent>
          <span style={{ color: '#000000' }}>
            Sesame snaps topping chupa chups gingerbread pie.
          </span>
        </TextContent>
      </Section>
      <Section>
        <SubTitle>
          <span style={{ color: '#0075ff', backgroundColor: '#ffffff' }}><strong>DESCRIPTION</strong></span>
        </SubTitle>
        <TextContent>
          This course provides an in-depth study of Customer Relationship Management (CRM) principles and practices. Students will explore a wide range of topics related to CRM, including its application in various industries. By the end of the course, students will have a comprehensive understanding of CRM concepts and their practical implications.
        </TextContent>
      </Section>
      <Section>
        <SubTitle>
          <span style={{ color: '#0075ff' }}><strong>WHAT YOU'LL LEARN</strong></span>
        </SubTitle>
        <Icon src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/1711/checki.png" />
        <TextContent>
          Sesame snaps topping chupa
        </TextContent>
        <Icon src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/1711/checki.png" />
        <TextContent>
          Chups gingerbread pie.
        </TextContent>
      </Section>
      <Section>
        <SubTitle>
          <span style={{ color: '#0075ff' }}><strong>COURSE OUTLINE</strong></span>
        </SubTitle>
        <TextContent>
          Sesame snaps topping chupa chups gingerbread pie.
        </TextContent>
      </Section>
      <Section>
        <SubTitle>
          <span style={{ color: '#0075ff' }}><strong>ASSESSMENT</strong></span>
        </SubTitle>
        <TextContent>
          <span style={{ color: '#000000' }}>
            Sesame snaps topping chupa chups gingerbread pie.
          </span>
        </TextContent>
      </Section>
    </Container>
  );
};

export default CourseSyllabus;
