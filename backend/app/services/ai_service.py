import re
from typing import List, Dict, Any, Optional

class AIService:
    @staticmethod
    def classify_intent(comment_text: str, automations: List[Dict[str, Any]]) -> Optional[str]:
        """
        Classifies incoming comment intent to match it to an automation ID.
        Uses fuzzy keyword and phrase parsing for local fallback, simulating an AI model.
        """
        comment_clean = comment_text.lower().strip()
        
        # Scoring match for each automation
        best_match_id = None
        highest_score = 0
        
        for auto in automations:
            score = 0
            # Check automation name keywords
            name_words = re.findall(r'\w+', auto['name'].lower())
            for word in name_words:
                if len(word) > 2 and word in comment_clean:
                    score += 2
            
            # Check configured keywords for this automation
            for kw in auto['keywords']:
                kw_clean = kw.lower().strip()
                if kw_clean in comment_clean:
                    score += 5  # Direct keyword matches get high priority
                elif len(kw_clean) > 3 and kw_clean[:int(len(kw_clean)*0.8)] in comment_clean:
                    score += 3  # Fuzzy match (prefix matching)
                    
            # Check common intent patterns for resource requests
            intent_keywords = ["send", "need", "want", "please", "pls", "give", "get", "share", "playlist", "link", "resource", "pdf"]
            if any(ik in comment_clean for ik in intent_keywords):
                score += 1
                
            if score > highest_score and score >= 4:
                highest_score = score
                best_match_id = auto['id']
                
        return best_match_id

    @staticmethod
    def suggest_keywords(automation_name: str, description: str = "") -> List[str]:
        """
        Generates keyword suggestions based on the automation configuration.
        """
        combined = f"{automation_name} {description}".lower()
        suggestions = set()
        
        # Add basic name derivatives
        name_words = [w for w in re.findall(r'\w+', automation_name.lower()) if len(w) > 2]
        if name_words:
            suggestions.add(" ".join(name_words))
            for w in name_words:
                suggestions.add(w)
                
        # Subject matching lists
        subjects = {
            "python": ["python playlist", "python course", "python code", "learn python", "py", "python notes"],
            "javascript": ["js", "js course", "javascript roadmap", "learn js", "react"],
            "ai": ["ai roadmap", "artificial intelligence", "ml", "machine learning", "ai roadmap", "llm"],
            "resume": ["resume template", "cv", "resume review", "job prep", "portfolio"],
            "roadmap": ["roadmap", "career guide", "learning path", "study guide"],
            "playlist": ["playlist", "videos", "youtube", "tutorial", "lectures"],
            "notes": ["notes", "pdf", "cheat sheet", "study notes", "handout", "guide"]
        }
        
        for key, words in subjects.items():
            if key in combined:
                for w in words:
                    suggestions.add(w)
                    
        # Add fallback generic trigger phrases if suggestions are small
        if len(suggestions) < 3:
            suggestions.update(["send link", "resource", "info", "details"])
            
        return list(suggestions)[:10]

    @staticmethod
    def generate_auto_reply(prompt: str, tone: str = "friendly", resource_type: str = "link") -> str:
        """
        Generates engaging automated direct messages.
        """
        greeting = "Hey {username} 👋"
        if tone == "professional":
            greeting = "Hello {username},"
        elif tone == "exciting":
            greeting = "Woohoo {username}! 🎉 Let's get started!"
            
        body = ""
        closing = "Happy learning! 🚀"
        
        if resource_type == "playlist":
            body = "Thank you for commenting! Here is the playlist resource you requested: {link}\nIt contains step-by-step videos to get you from absolute beginner to advanced."
        elif resource_type == "pdf":
            body = "Here are the PDF cheat sheets and study notes you asked for: {link}\nYou can download them and print them out for quick reference!"
            closing = "Hope this helps your studies! 📚 Let me know if you need anything else."
        elif resource_type == "notion":
            body = "I've sent the interactive Notion workspace template directly to you: {link}\nMake sure to duplicate it to your own workspace!"
            closing = "Organize like a pro! 💻"
        else:
            body = f"Here is the link to the resource: {{link}}\n\nDetails: {prompt}"
            
        return f"{greeting}\n\n{body}\n\n{closing}"

ai_service = AIService()
