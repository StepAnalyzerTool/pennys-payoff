"""Penny's Playdate: browser-timed caregiver-response prototype."""
from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Penny’s Playdate", page_icon="🐾", layout="wide")
st.markdown("<style>.block-container{padding-top:1rem;padding-bottom:0}header{visibility:hidden}</style>", unsafe_allow_html=True)
frontend = Path(__file__).parent / "frontend"
task = components.declare_component("pennys_playdate", path=str(frontend))
task(available_media=sorted(p.name for p in (frontend / "media").iterdir() if p.is_file()), key="pennys_playdate")
