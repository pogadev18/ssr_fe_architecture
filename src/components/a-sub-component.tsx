import './a-sub-component.css';

export const ASubComponent = (props: { title: string }) => {
  // Your component code here
  return <div className="bg-yellow">ASubComponent here: {props.title}</div>;
};