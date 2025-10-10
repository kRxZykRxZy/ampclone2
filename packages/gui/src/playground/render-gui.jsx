import React, { useEffect } from "react";
import GUI from "../containers/gui.jsx";
import { Provider, useDispatch } from "react-redux";
import { configureStore, createSlice } from "@reduxjs/toolkit";

const sessionSlice = createSlice({
  name: "session", initialState: { status: "LOGGED_OUT", username: null, userId: null },
  reducers: { setSession: (s, a) => { s.status="LOGGED_IN"; s.username=a.payload.username; s.userId=a.payload.userId } }
});

const store = configureStore({ reducer: { session: sessionSlice.reducer } });

const FetchSession = () => { const dispatch = useDispatch(); useEffect(() => { async function get(){ try{ const res=await fetch("https://ampmod.vercel.app/internalapi/session"); const d=await res.json(); if(d.username) dispatch(sessionSlice.actions.setSession({ username:d.username,userId:d.userId })); } catch(e){console.error(e);} } get(); }, [dispatch]); return null; };
const searchParams = new URLSearchParams(location.search);
const cloudHost = searchParams.get("cloud_host") || "wss://clouddata.turbowarp.org";
const creatingNewProject = searchParams.get("new_project")==="1";

const RenderGUI = props => <Provider store={store}><FetchSession /><GUI cloudHost={cloudHost} canUseCloud canCreateNew={creatingNewProject} canShare={false} hasCloudPermission canSave basePath={process.env.ROOT} canEditTitle enableCommunity={true} {...props} /></Provider>;

export default RenderGUI;