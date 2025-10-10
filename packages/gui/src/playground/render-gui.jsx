import React, { useEffect } from "react";
import GUI from "../containers/gui.jsx";
import { createStore } from "redux";
import { Provider, connect } from "react-redux";

const store = createStore((s={status:"LOGGED_OUT",username:null,userId:null},a) => a.type==="SET_SESSION"?{status:"LOGGED_IN",username:a.username,userId:a.userId}:s);
const searchParams = new URLSearchParams(location.search);
const cloudHost = searchParams.get("cloud_host") || "wss://clouddata.turbowarp.org";
const creatingNewProject = searchParams.get("new_project")==="1";

const GUIWrapper = ({session,setSession}) => {
  useEffect(()=>{fetch("https://ampmod.vercel.app/internalapi/session").then(r=>r.json()).then(d=>d.username&&setSession(d.username,d.userId)).catch(console.error);},[setSession]);
  return <GUI cloudHost={cloudHost} canUseCloud canCreateNew={creatingNewProject} canShare={false} hasCloudPermission canSave basePath={process.env.ROOT} canEditTitle enableCommunity={true} session={session} />;
};

const ConnectedGUI = connect(s=>({session:s}), d=>({setSession:(u,id)=>d({type:"SET_SESSION",username:u,userId:id})}))(GUIWrapper);
const RenderGUI = props => <Provider store={store}><ConnectedGUI {...props} /></Provider>;
export default RenderGUI;
