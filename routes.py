import json
import os
from flask import render_template, jsonify, request
from app import app, db
from models import Innovation


@app.route('/')
def index():
    """Main timeline page"""
    return render_template('index.html')


@app.route('/api/innovations')
def get_innovations():
    """API endpoint to get all innovations with optional filtering"""
    category = request.args.get('category')
    search = request.args.get('search')
    start_year = request.args.get('start_year', type=int)
    end_year = request.args.get('end_year', type=int)
    
    # Load innovations from JSON file
    innovations = load_innovations_from_json()
    
    # Apply filters
    if category and category != 'all':
        innovations = [i for i in innovations if i['category'].lower() == category.lower()]
    
    if search:
        search_lower = search.lower()
        innovations = [i for i in innovations if 
                      search_lower in i['title'].lower() or 
                      search_lower in i['description'].lower() or
                      search_lower in i.get('inventor', '').lower()]
    
    if start_year:
        innovations = [i for i in innovations if i['year'] >= start_year]
    
    if end_year:
        innovations = [i for i in innovations if i['year'] <= end_year]
    
    # Sort by year
    innovations.sort(key=lambda x: x['year'])
    
    return jsonify(innovations)


def load_innovations_from_json():
    """Load innovations data from JSON file"""
    json_path = os.path.join(app.root_path, 'data', 'innovations.json')
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('innovations', [])
    except FileNotFoundError:
        app.logger.error(f"Innovations JSON file not found at {json_path}")
        return []
    except json.JSONDecodeError as e:
        app.logger.error(f"Error decoding JSON: {e}")
        return []


@app.route('/api/categories')
def get_categories():
    """Get all unique categories"""
    innovations = load_innovations_from_json()
    categories = list(set(i['category'] for i in innovations))
    categories.sort()
    return jsonify(categories)


@app.route('/api/innovation/<int:innovation_id>')
def get_innovation(innovation_id):
    """Get detailed information about a specific innovation"""
    innovations = load_innovations_from_json()
    innovation = next((i for i in innovations if i['id'] == innovation_id), None)
    
    if innovation:
        return jsonify(innovation)
    else:
        return jsonify({'error': 'Innovation not found'}), 404
