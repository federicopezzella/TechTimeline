from app import db


class Innovation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, nullable=False)
    impact = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    inventor = db.Column(db.String(200))
    location = db.Column(db.String(200))
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'year': self.year,
            'description': self.description,
            'impact': self.impact,
            'category': self.category,
            'inventor': self.inventor,
            'location': self.location
        }
