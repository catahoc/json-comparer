import React, {useState} from 'react';
import './app.css';
import {emptyDiff} from "./diff/line";
import {computeDiff} from "./differ/compute-diff";
import {DiffRenderer} from "./diff-renderer";

export const App = React.memo(() => {
    const leftRef = React.useRef<HTMLTextAreaElement | null>(null);
    const rightRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [diff, setDiff] = useState(emptyDiff);
    const change = React.useCallback(() => {
        try {
            const left = JSON.parse(leftRef.current?.value || '{}');
            const right = JSON.parse(rightRef.current?.value || '{}');
            const diff = computeDiff(left, right);
            setDiff(diff);
        } catch (e) {
            console.warn(`Failed to compute diff ` + e.message);
        }

    }, []);
    return <>
        <div className="input-container">
            <textarea className="input-area left-input" ref={leftRef} onChange={change}/>
            <textarea className="input-area right-input" ref={rightRef} onChange={change}/>
        </div>
        <div className="output-container">
            <DiffRenderer model={diff}/>
        </div>
    </>
});