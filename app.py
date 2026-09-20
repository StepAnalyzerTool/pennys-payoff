"""Penny's Payoff: browser-timed video-choice prototype."""
from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Penny’s Payoff", page_icon="🐾", layout="wide")
st.markdown("<style>.block-container{padding-top:1rem;padding-bottom:0}header{visibility:hidden}</style>", unsafe_allow_html=True)
task = components.declare_component("pennys_payoff", path=str(Path(__file__).parent / "frontend"))
task(key="pennys_payoff")
