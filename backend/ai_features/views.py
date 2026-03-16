from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import google.generativeai as genai
from django.conf import settings
import os

# Configure Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def rewrite_text(request):
    """Rewrite text using AI for better clarity and professionalism"""
    try:
        text = request.data.get('text', '')
        if not text:
            return Response(
                {'error': 'Text is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prompt = f"""
        Please rewrite the following text to make it more professional, clear, and well-structured. 
        Keep the original meaning but improve the language and flow:
        
        {text}
        
        Provide only the rewritten text without any explanations.
        """
        
        response = model.generate_content(prompt)
        rewritten_text = response.text.strip()
        
        return Response({
            'original_text': text,
            'rewritten_text': rewritten_text
        })
        
    except Exception as e:
        return Response(
            {'error': f'AI processing failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def fix_grammar(request):
    """Fix grammar and spelling errors in text"""
    try:
        text = request.data.get('text', '')
        if not text:
            return Response(
                {'error': 'Text is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prompt = f"""
        Please fix any grammar, spelling, and punctuation errors in the following text. 
        Keep the original meaning and structure as much as possible:
        
        {text}
        
        Provide only the corrected text without any explanations.
        """
        
        response = model.generate_content(prompt)
        corrected_text = response.text.strip()
        
        return Response({
            'original_text': text,
            'corrected_text': corrected_text
        })
        
    except Exception as e:
        return Response(
            {'error': f'AI processing failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def enhance_complaint(request):
    """Enhance complaint description for better clarity and impact"""
    try:
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        category = request.data.get('category', '')
        
        if not description:
            return Response(
                {'error': 'Description is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prompt = f"""
        Please enhance this complaint description to make it more professional, clear, and impactful.
        The complaint is about: {category}
        Title: {title}
        Current description: {description}
        
        Provide an enhanced version that:
        1. Is more professional and clear
        2. Includes relevant details that might be missing
        3. Uses appropriate tone for a community complaint
        4. Is well-structured and easy to understand
        
        Return only the enhanced description without any explanations.
        """
        
        response = model.generate_content(prompt)
        enhanced_description = response.text.strip()
        
        return Response({
            'original_description': description,
            'enhanced_description': enhanced_description
        })
        
    except Exception as e:
        return Response(
            {'error': f'AI processing failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_notice(request):
    """Generate a professional notice based on input"""
    try:
        topic = request.data.get('topic', '')
        key_points = request.data.get('key_points', '')
        tone = request.data.get('tone', 'professional')  # professional, friendly, urgent
        
        if not topic:
            return Response(
                {'error': 'Topic is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prompt = f"""
        Please generate a professional community notice about: {topic}
        
        Key points to include: {key_points}
        Tone: {tone}
        
        The notice should be:
        1. Clear and concise
        2. Professional in tone
        3. Well-structured with appropriate formatting
        4. Suitable for a community notice board
        
        Return only the notice text without any explanations.
        """
        
        response = model.generate_content(prompt)
        notice_text = response.text.strip()
        
        return Response({
            'topic': topic,
            'generated_notice': notice_text
        })
        
    except Exception as e:
        return Response(
            {'error': f'AI processing failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 