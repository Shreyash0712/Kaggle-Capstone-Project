"""
@fileoverview OpenPath Component
@module app/tools/issue_complexity
@description Custom tool for heuristically calculating issue complexity based on files/lines changed.
@dependencies []
@stateConsumed []
@stateProduced []
"""

def calculate_issue_complexity(files_changed: int, lines_added: int, lines_deleted: int) -> str:
    """
    Calculates a heuristic complexity score ('Easy', 'Medium', 'Hard') 
    based on the number of files and lines changed.
    """
    total_lines_changed = lines_added + lines_deleted
    
    if files_changed <= 2 and total_lines_changed <= 50:
        return "Easy"
    elif files_changed <= 7 and total_lines_changed <= 300:
        return "Medium"
    else:
        return "Hard"
