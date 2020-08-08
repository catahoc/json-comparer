import React from "react";
import {Diff} from "./diff/line";
import {renderLine} from "./differ/compute-diff";
import './diff-renderer.css';

export const DiffRenderer = React.memo(({model: {lines}}: { model: Diff }) => {
    return <div className="diff">
        {lines.map(x => {
            switch (x.type) {
                case "same":
                    return <div className="diff__line-pair">
                        <pre className="diff__line diff__left-line">{renderLine(x.line)}</pre>
                        <pre className="diff__line diff__right-line">{renderLine(x.line)}</pre>
                    </div>;
                case "leftonly":
                    return <div className="diff__line-pair">
                        <pre className="diff__line diff__left-line">{renderLine(x.line)}</pre>
                        <pre className="diff__line diff__right-line diff__missing"/>
                    </div>;
                case "rightonly":
                    return <div className="diff__line-pair">
                        <pre className="diff__line diff__left-line diff__missing"/>
                        <pre className="diff__line diff__right-line">{renderLine(x.line)}</pre>
                    </div>;
                case "different":
                    return <div className="diff__line-pair">
                        <pre className="diff__line diff__left-line diff__different-line">{renderLine(x.left)}</pre>
                        <pre className="diff__line diff__right-line diff__different-line">{renderLine(x.right)}</pre>
                    </div>;
                default:
                    return null;
            }
        })}
    </div>
})

